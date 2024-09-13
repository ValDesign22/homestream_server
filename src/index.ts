import 'dotenv/config';

import { watch } from 'chokidar';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'fs';
import { Server } from 'ws';

import { collectionHandler } from './routes/collection.get';
import { configGetHandler } from './routes/config.get';
import { configPatchHandler } from './routes/config.patch';
import { detailsGetHandler } from './routes/details.get';
import { detailsPatchHandler } from './routes/details.patch';
import { foldersHandler } from './routes/folders.get';
import { previewHandler } from './routes/preview.get';
import { profilesDelete } from './routes/profiles.delete';
import { profilesGet } from './routes/profiles.get';
import { profilesPatch } from './routes/profiles.patch';
import { profilesPost } from './routes/profiles.post';
import { setupHandler } from './routes/setup.get';
import { storesHandler } from './routes/stores.get';
import { trackHandler } from './routes/track.get';
import { tracksHandler } from './routes/tracks.get';
import { updateGetHandler } from './routes/update.get';
import { updatePostHandler } from './routes/update.post';
import { videoHandler } from './routes/video.get';

import { load_config } from './utils/config';
import { EMediaType, ENotificationType, IMovie, ITvShow, ITvShowEpisode } from './utils/types';
import { load_store, save_store } from './utils/store';
import { search_movie, search_tvshow_episode } from './utils/tmdb';
import { checkForUpdates, downloadAndApplyUpdate } from './utils/updater';
import { getProfiles } from './utils/profiles';
import { deleteSubtitles, extractSubtitles } from './utils/subtitles';

const app = express();

const wss = new Server({ noServer: true });
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
  ws.send('connected');
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));
app.use(express.static('public'));
app.use(express.static('assets'));
app.use(express.static('views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/collection', collectionHandler);
app.get('/config', configGetHandler);
app.patch('/config', configPatchHandler);
app.get('/details', detailsGetHandler);
app.patch('/details', detailsPatchHandler);
app.get('/folders', foldersHandler);
app.get('/preview', previewHandler);
app.delete('/profiles', profilesDelete);
app.get('/profiles', profilesGet);
app.patch('/profiles', profilesPatch);
app.post('/profiles', profilesPost);
app.get('/setup', setupHandler);
app.get('/stores', storesHandler);
app.get('/track', trackHandler);
app.get('/tracks', tracksHandler);
app.get('/update', updateGetHandler);
app.post('/update', updatePostHandler);
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

const sendNotification = async (data: IMovie | ITvShow) => {
  const profiles = getProfiles();
  if (!profiles || !profiles.length) return;
  const media_type = data.hasOwnProperty('collection_id') ? EMediaType.Movies : EMediaType.TvShows;

  for (const profile of profiles) {
    if (profile.favorites.find((favorite) => favorite.id === data.id)) {
      return wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({
          profile_id: profile.id,
          media_type,
          notification_type: ENotificationType.Favorites,
          data,
        }));
      });
    };
    if (profile.watchlist.find((watchlist) => watchlist.id === data.id)) {
      return wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({
          profile_id: profile.id,
          media_type,
          notification_type: ENotificationType.Watchlist,
          data,
        }));
      });
    };
  }
};

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

  if (!['avi', 'mkv', 'mp4', 'webm', 'wmv'].includes(path.split('.').pop() as string)) return;

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
          if (date_match && date_match[0].length === 4 && date_match[0].length !== file_name.length && date_match[0].split('').every((char) => !isNaN(parseInt(char)))) date = date_match[0];
          const title = date ? file_name.split(' ').slice(0, -1).join(' ') : file_name;

          const movie = await search_movie(title, date, config);

          if (movie) {
            currentStore.push({
              ...movie,
              path,
            });

            sendNotification(movie);
          }

          save_store(folder, currentStore);
          break;
        case EMediaType.TvShows:
          const tvshows = load_store(folder) as ITvShow[];

          for (const tvshow of tvshows) {
            if (!tvshow.path || !path.startsWith(tvshow.path)) continue;
            for (const season of tvshow.seasons) {
              if (!season.path || !path.startsWith(season.path)) continue;
              const existing_episode = season.episodes.find((episode) => episode.path === path);
              if (existing_episode) return;

              const file = path.split('/').pop() as string;
              const file_name = file.split('.').slice(0, -1).join('.');

              const episode_number = (() => {
                const firstSplit = file_name.split('.').shift();
                if (!firstSplit) return null;
                const lastWord = firstSplit.trim().split(/\s+/).pop();
                if (!lastWord) return null;
                const epidosePart = lastWord.replace('E', '');
                if (!epidosePart) return null;
                if ([...epidosePart].every((char) => !isNaN(parseInt(char)))) return parseInt(epidosePart);
                return null;
              })();

              if (!episode_number) continue;

              const episode = await search_tvshow_episode(tvshow.id, season.season_number, episode_number, config);
              if (episode) {
                season.episodes.push({
                  ...episode,
                  path,
                });

                sendNotification(tvshow);
              }
            }
          }

          save_store(folder, tvshows);
          break;
      }
      const media_type = folder.media_type === EMediaType.Movies ? 'Movie' : 'TvShow';
      console.log(`${media_type} added:`, path);
    }
  }
  if (event === 'unlink') {
    for (const folder of config.folders) {
      if (!path.startsWith(folder.path)) continue;
      switch (folder.media_type) {
        case EMediaType.Movies:
          const currentStore = load_store(folder) as IMovie[];
          const movie = currentStore.find((movie) => movie.path === path);
          if (!movie) return;
          deleteSubtitles(movie);
          const newStore = currentStore.filter((movie) => movie.path !== path);
          save_store(folder, newStore);
          break;
        case EMediaType.TvShows:
          const tvshows = load_store(folder) as ITvShow[];

          for (const tvshow of tvshows) {
            if (!tvshow.path || !path.startsWith(tvshow.path)) continue;
            for (const season of tvshow.seasons) {
              if (!season.path || !path.startsWith(season.path)) continue;
              const episode = season.episodes.find((episode) => episode.path === path) as ITvShowEpisode;
              if (!episode) continue;
              deleteSubtitles(episode);
              const newEpisodes = season.episodes.filter((episode) => episode.path !== path);
              season.episodes = newEpisodes;
            }
          }

          save_store(folder, tvshows);
          break
      }
      const media_type = folder.media_type === EMediaType.Movies ? 'Movie' : 'TvShow';
      console.log(`${media_type} removed:`, path);
    }
  }
});

setInterval(async () => {
  const updater = await checkForUpdates();
  if (updater.updateAvailable && updater.downloadUrl) await downloadAndApplyUpdate(updater.downloadUrl);
}, 3600000);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request);
  });
});
