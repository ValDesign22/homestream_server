import 'dotenv/config';

import { watch } from 'chokidar';
import express from 'express';
import { existsSync } from 'fs';

import { configHandler } from './routes/config.patch';
import { detailsHandler } from './routes/details.get';
import { extractHandler } from './routes/extract.get';
import { foldersHandler } from './routes/folders.get';
import { setupHandler } from './routes/setup.get';
import { storesHandler } from './routes/stores.get';
import { previewHandler } from './routes/preview.get';
import { tracksHandler } from './routes/tracks.get';
import { videoHandler } from './routes/video.get';
import { collectionHandler } from './routes/collection.get';

import { load_config } from './utils/config';
import { EMediaType, IMovie } from './utils/types';
import { explore_movies_folder, explore_tvshows_folder } from './utils/explore';
import { load_store, save_store } from './utils/store';
import { search_movie } from './utils/tmdb';

const app = express();

app.use(express.static('public'));
app.use(express.static('assets'));
app.use(express.static('views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/collection', collectionHandler);
app.patch('/config', configHandler);
app.get('/details', detailsHandler);
app.get('/extract', extractHandler);
app.get('/folders', foldersHandler);
app.get('/setup', setupHandler);
app.get('/stores', storesHandler);
app.get('/preview', previewHandler);
app.get('/tracks', tracksHandler);
app.get('/video', videoHandler);

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} - ${res.statusCode}`);
    console.log('Headers:', res.getHeaders());
    console.log('Body:', req.body);
  });  

  next();
});

const watchDir = process.env.WATCH_DIR;
if (!watchDir) throw new Error('WATCH_DIR is not defined');
if (!existsSync(watchDir)) throw new Error('WATCH_DIR does not exist');

const watcher = watch(watchDir, { 
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  depth: 99,
  usePolling: true,
});

watcher.on('all', async (event, path) => {
  const config = load_config();
  if (!config.folders) return;
  
  if (event === 'add') {
    for (const folder of config.folders) {
      if (!path.startsWith(folder.path)) continue;
      switch (folder.media_type) {
        case EMediaType.Movies:
          const currentStore = load_store(folder) as IMovie[];
          if (currentStore.find((movie) => movie.path === path)) return;

          const file = path.split('/').pop() as string;
          const file_name = file.split('.').slice(0, -1).join('.');
          let date = null;
          const date_match = file_name.match(/\d{4}/);
          if (date_match && date_match[0].length === 4 && date_match[0].length !== file_name.length && date_match[0].split('').every((char) => !isNaN(parseInt(char)))) {
            date = date_match[0];
          }
          const title = date ? file_name.split(' ').slice(0, -1).join(' ') : file_name;

          const newMovie = await search_movie(title, date, config);

          if (newMovie) {
            currentStore.push({
              ...newMovie,
              path,
            });
          }

          save_store(folder, currentStore);
          break;
        case EMediaType.TvShows:
          const tvshows = await explore_tvshows_folder(config, folder);
          save_store(folder, tvshows);
          break;
      }
    }
  }
  if (event === 'unlink') {
    for (const folder of config.folders) {
      if (!path.startsWith(folder.path)) continue;
      switch (folder.media_type) {
        case EMediaType.Movies:
          const currentStore = load_store(folder) as IMovie[];
          const newStore = currentStore.filter((movie) => movie.path !== path);
          save_store(folder, newStore);
          break;
        case EMediaType.TvShows:
          const tvshows = await explore_tvshows_folder(config, folder);
          save_store(folder, tvshows);
          break
      }
    }
  }

  console.log(`Event: ${event}, Path: ${path}`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
