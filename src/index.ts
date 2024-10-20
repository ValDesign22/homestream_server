import 'dotenv/config';

import { NuxumApp } from '@nuxum/core';
import { watch } from 'chokidar';
import { existsSync } from 'node:fs';

import { AppModule } from './modules/app.module.js';

import { load_config } from './utils/config.js';
import { EMediaType, IMovie, ITvShow, ITvShowEpisode } from './utils/types.js';
import { load_store, save_store } from './utils/store.js';
import { search_movie, search_tvshow_episode } from './utils/tmdb.js';
import { checkForUpdates, downloadAndApplyUpdate } from './utils/updater.js';
import { deleteSubtitles } from './utils/subtitles.js';


async function bootstrap() {
  const app = new NuxumApp({
    modules: [
      AppModule,
    ],
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type'],
      credentials: true,
    },
    logger: true,
  });

  const watchDir = process.env.WATCH_DIR;
  if (!watchDir) throw new Error('WATCH_DIR is not defined');
  if (!existsSync(watchDir)) throw new Error('WATCH_DIR does not exist');

  const watcher = watch(watchDir, {
    ignored: (path) => /(^|[\/\\])\../.test(path),
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

            if (movie) currentStore.push({
              ...movie,
              path,
            });

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
                if (episode) season.episodes.push({
                  ...episode,
                  path,
                });
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

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
