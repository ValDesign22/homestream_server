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
import { EMediaType } from './utils/types';
import { explore_movies_folder, explore_tvshows_folder } from './utils/explore';
import { save_store } from './utils/store';

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
  
  if (event === 'add' || event === 'unlink') {
    for (const folder of config.folders) {
      if (!path.startsWith(folder.path)) continue;
      switch (folder.media_type) {
        case EMediaType.Movies:
          const movies = await explore_movies_folder(config, folder);
          save_store(folder, movies);
          break;
        case EMediaType.TvShows:
          const tvshows = await explore_tvshows_folder(config, folder);
          save_store(folder, tvshows);
          break;
      }
    }
  }

  console.log(`Event: ${event}, Path: ${path}`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
