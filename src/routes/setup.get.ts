import { Request, Response } from 'express';
import { load_config } from '../utils/config';
import { EMediaType } from '../utils/types';
import { explore_movies_folder, explore_tvshows_folder } from '../utils/explore';
import { save_store } from '../utils/store';

const setupHandler = async (req: Request, res: Response) => {
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

  res.status(200).json({ message: 'Setup completed successfully' });
};

export { setupHandler };
