import { analyze_collections } from './library/collection.service';
import { analyze_movies } from './library/movie.service';
import { analyze_tvshows } from './library/tv.service';
import { EMediaType } from '../utils/types/enums.util';
import { IConfig, IFolder } from '../utils/types/interfaces.util';

export const analyze_library = async (folder: IFolder, config: IConfig): Promise<void> => {
  switch (folder.media_type) {
    case EMediaType.Movies:
      await analyze_movies(folder, config);
      if (config.create_collections) await analyze_collections(folder, config);
    case EMediaType.TvShows:
      await analyze_tvshows(folder, config);
  }
};
