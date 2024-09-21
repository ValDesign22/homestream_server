import express from 'express';
import { load_config } from '../utils/config.js';
import { EMediaType } from '../utils/types.js';
import { explore_movies_folder, explore_tvshows_folder } from '../utils/explore.js';
import { save_store } from '../utils/store.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';

class SetupController extends Controller {
  @Route({
    path: '/setup',
    method: HttpMethod.GET,
  })
  public async get(_: express.Request, res: express.Response) {
    const config = load_config();

    for (const folder of config.folders) {
      console.log(`Exploring ${folder.name} folder...`);
      switch (folder.media_type) {
        case EMediaType.Movies:
          const movies = await explore_movies_folder(config, folder);
          save_store(folder, movies);
          console.log(`Found ${movies.length} movies`);
          break;
        case EMediaType.TvShows:
          const tvshows = await explore_tvshows_folder(config, folder);
          save_store(folder, tvshows);
          console.log(`Found ${tvshows.length} tv shows`);
          break
      }
    }

    return this.sendResponse(res, { message: 'Setup completed successfully' });
  }
}

export const setupController = new SetupController();
