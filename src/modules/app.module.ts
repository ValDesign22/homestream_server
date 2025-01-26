import { Module } from '@nuxum/core';
import { AnalyzeController } from '#/controllers/analyze.controller';
import { CollectionController } from '#/controllers/collection.controller';
import { FoldersController } from '#/controllers/folders.controller';
import { SearchController } from '#/controllers/search.controller';
import { StoresController } from '#/controllers/stores.controller';
import { TestController } from '#/controllers/test.controller';
import { MoviePlaybackController } from '#/controllers/playback/movie.controller';
import { MovieController } from '#/controllers/movies/[id]/index.controller';
import { ConnectController } from '#/controllers/connect.controller';
import { LibrariesController } from '#/controllers/libraries.controller';

@Module({
  controllers: [
    AnalyzeController,
    CollectionController,
    FoldersController,
    MoviePlaybackController,
    MovieController,
    SearchController,
    StoresController,
    TestController,
    ConnectController,
    LibrariesController,
  ],
})
export class AppModule {}
