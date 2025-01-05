import 'dotenv/config';

import { NuxumApp } from '@nuxum/core';
import { watch } from 'chokidar';
import { existsSync } from 'node:fs';

import { AppModule } from './modules/app.module';

import { ensure_app_folders, load_config } from './utils/config';
import { EMediaType, IMovie, ITvShow } from './utils/types';
import { load_store, save_store } from './utils/store';
import { search_movie, search_tvshow, search_tvshow_episode, search_tvshow_season } from './utils/tmdb';
import { checkForUpdates, downloadAndApplyUpdate } from './utils/updater';
import { deleteSubtitles } from './utils/subtitles';
import { ConfigMiddleware } from './middlewares/config.middleware';

async function bootstrap() {
  ensure_app_folders();

  const app = new NuxumApp({
    modules: [AppModule],
    middlewares: [ConfigMiddleware],
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type'],
      credentials: true,
    },
    logger: true,
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
