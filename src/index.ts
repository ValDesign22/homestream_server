import 'dotenv/config';

import { NuxumApp } from '@nuxum/core';
import { watch } from 'chokidar';
import { existsSync } from 'node:fs';

import { AppModule } from './modules/app.module';

import { load_config } from './utils/config';
import { EMediaType, IMovie, ITvShow } from './utils/types';
import { load_store, save_store } from './utils/store';
import { search_movie, search_tvshow, search_tvshow_episode, search_tvshow_season } from './utils/tmdb';
import { checkForUpdates, downloadAndApplyUpdate } from './utils/updater';
import { deleteSubtitles } from './utils/subtitles';

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
    const { folders, tmdb_language } = load_config();
    if (!folders) return;

    if (!['avi', 'mkv', 'mp4', 'webm', 'wmv'].includes(path.split('.').pop() as string)) return;

    if (event === 'add') {
      for (const folder of folders) {
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
            const movie_title = date ? file_name.split(' ').slice(0, -1).join(' ') : file_name;

            const movie = await search_movie(movie_title, date, tmdb_language);

            if (movie) currentStore.push({
              ...movie,
              path,
            });

            save_store(folder, currentStore);
            break;
          case EMediaType.TvShows:
            const tvshows = load_store(folder) as ITvShow[];

            const filename = path.split('/').pop() as string;
            const episode_match = filename.match(/S\d{2} E\d{2}/);
            if (!episode_match) continue;
            const tvshow_title = filename.split(episode_match[0]).shift()?.trim();
            if (!tvshow_title) continue;

            let tvshow_id = null;
            for (const tvshow of tvshows) {
              if (tvshow.title === tvshow_title) {
                tvshow_id = tvshow.id;
                break;
              }
            }
            if (!tvshow_id) {
              const tvshow = await search_tvshow(tvshow_title, null, tmdb_language);
              if (!tvshow) continue;
              const existing_tvshow = tvshows.find((t) => t.id === tvshow.id);
              if (existing_tvshow) tvshow_id = existing_tvshow.id;
              else {
                tvshow_id = tvshow.id;
                tvshows.push(tvshow);
              }
            }

            const tvshow = tvshows.find((t) => t.id === tvshow_id);
            if (!tvshow) continue;

            const season_number = parseInt(episode_match[0].slice(1, 3));
            if (isNaN(season_number)) continue;

            let tvshow_season = tvshow.seasons.find((s) => s.season_number === season_number);
            if (!tvshow_season) {
              const season = await search_tvshow_season(tvshow_id, season_number, tmdb_language);
              if (!season) continue;
              tvshow.seasons.push(season);
              tvshow_season = season;
            } else tvshow.seasons.push(tvshow_season);
            if (!tvshow_season) continue;

            const episode_number = parseInt(episode_match[0].slice(-2));
            if (isNaN(episode_number)) continue;

            const existing_episode = tvshow_season.episodes.find((e) => e.episode_number === episode_number);
            if (existing_episode) continue;

            const episode_data = await search_tvshow_episode(tvshow_id, season_number, episode_number, tmdb_language);
            if (!episode_data) continue;
            tvshow_season.episodes.push({
              ...episode_data,
              path,
            });

            if (!tvshows.includes(tvshow)) tvshows.push(tvshow);

            save_store(folder, tvshows);
            break;
        }
        const media_type = folder.media_type === EMediaType.Movies ? 'Movie' : 'TvShow';
        console.log(`${media_type} added:`, path);
      }
    }
    else if (event === 'unlink') {
      for (const folder of folders) {
        if (!path.startsWith(folder.path)) continue;
        switch (folder.media_type) {
          case EMediaType.Movies:
            const currentStore = load_store(folder) as IMovie[];
            const movie = currentStore.find((movie) => movie.path === path);
            if (!movie) return;
            deleteSubtitles(movie);
            save_store(folder, currentStore.filter((movie) => movie.path !== path));
            break;
          case EMediaType.TvShows:
            const tvshows = load_store(folder) as ITvShow[];
            const tvshow = tvshows.find((tvshow) => tvshow.seasons.some((season) => season.episodes.some((episode) => episode.path === path)));
            if (!tvshow) return;
            const newTvshows = tvshows.map((t) => {
              if (t.id === tvshow.id) {
                const newTvshow = { ...t };
                newTvshow.seasons = newTvshow.seasons.map((s) => {
                  const newSeason = { ...s };
                  newSeason.episodes = newSeason.episodes.filter((e) => e.path !== path);
                  return newSeason;
                });
                return newTvshow;
              }
              return t;
            });
            save_store(folder, newTvshows);
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
