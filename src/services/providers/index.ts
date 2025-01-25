import { tmdb_search } from '#/services/providers/tmdb/index';
import { ITmdbMovie, ITmdbTvShow } from '#/utils/types/tmdb.types';

export const search = async (
  query: string,
  type: string,
): Promise<ITmdbMovie[] | ITmdbTvShow[]> => {
  switch (type) {
    case 'movie':
    case 'tv':
      return await tmdb_search(query, type);
    default:
      return [];
  }
};
