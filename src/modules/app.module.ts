import { Module } from '@nuxum/core';
import { AnalyzeController } from '../controllers/analyze.controller';
import { CollectionController } from '../controllers/collection.controller';
import { ConfigController } from '../controllers/config.controller';
import { DetailsController } from '../controllers/details.controller';
import { FoldersController } from '../controllers/folders.controller';
import { PreviewController } from '../controllers/preview.controller';
import { ProfilesController } from '../controllers/profiles.controller';
import { SearchController } from '../controllers/search.controller';
import { SetupController } from '../controllers/setup.controller';
import { StoresController } from '../controllers/stores.controller';
import { TrackController } from '../controllers/track.controller';
import { UpdateController } from '../controllers/update.controller';
import { VideoController } from '../controllers/video.controller';
import { TracksController } from '../controllers/tracks.controller';
import { TestController } from '../controllers/test.controller';

@Module({
  controllers: [
    AnalyzeController,
    CollectionController, ConfigController, DetailsController, FoldersController,
    PreviewController, ProfilesController, SearchController, SetupController,
    StoresController, TrackController, TracksController, UpdateController,
    VideoController, TestController,
  ]
})
export class AppModule { }
