import { Module } from '@nuxum/core';
import { CollectionController } from '../controllers/collection.controller.js';
import { ConfigController } from '../controllers/config.controller.js';
import { DetailsController } from '../controllers/details.controller.js';
import { FoldersController } from '../controllers/folders.controller.js';
import { PreviewController } from '../controllers/preview.folder.js';
import { ProfilesController } from '../controllers/profiles.controller.js';
import { SearchController } from '../controllers/search.controller.js';
import { SetupController } from '../controllers/setup.controller.js';
import { StoresController } from '../controllers/stores.controller.js';
import { TrackController } from '../controllers/track.controller.js';
import { UpdateController } from '../controllers/update.controller.js';
import { VideoController } from '../controllers/video.controller.js';
import { TracksController } from '../controllers/tracks.controller.js';

@Module({
  controllers: [
    CollectionController, ConfigController, DetailsController, FoldersController,
    PreviewController, ProfilesController, SearchController, SetupController,
    StoresController, TrackController, TracksController, UpdateController,
    VideoController,
  ]
})
export class AppModule { }
