import { Request, Response } from 'express';
import { load_config } from '../utils/config';
import { EMediaType } from '../utils/types';
import { explore_movies_folder, explore_tvshows_folder } from '../utils/explore';
import { save_store } from '../utils/store';

const setupHandler = async (req: Request, res: Response) => {
  const config = load_config();

  for (const folder of config.folders) {
    switch (folder.media_type) {
      case EMediaType.Movies:
        const movies = await explore_movies_folder(config, folder);
        save_store(folder, movies)
        break;
      case EMediaType.TvShows:
        const tvshows = await explore_tvshows_folder(config, folder);
        save_store(folder, tvshows)
        break
    }
  }

  res.status(200).send('Setup completed');
};

export { setupHandler };
