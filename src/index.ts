import 'dotenv/config';

import { NuxumApp } from '@nuxum/core';

import { AppModule } from './modules/app.module';

import { ConfigMiddleware } from './middlewares/config.middleware';
import { ensure_app_folders } from './services/config.service';

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

  app.listen(process.env.PORT || 3000);
}

bootstrap();
