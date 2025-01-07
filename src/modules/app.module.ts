import { Module } from '@nuxum/core';
import { AnalyzeController } from '../controllers/analyze.controller';
import { CollectionController } from '../controllers/collection.controller';
import { FoldersController } from '../controllers/folders.controller';
import { SearchController } from '../controllers/search.controller';
import { StoresController } from '../controllers/stores.controller';
import { TestController } from '../controllers/test.controller';

@Module({
  controllers: [
    AnalyzeController, CollectionController, FoldersController,
    SearchController, StoresController, TestController,
  ]
})
export class AppModule { }
