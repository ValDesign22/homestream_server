import { tmdb_request } from '#/services/providers/tmdb/index';
import { ITmdbMovieCollection } from '#/utils/types/tmdb.types';

export const search_collection = async (
  id: number,
): Promise<ITmdbMovieCollection | null> => {
  return (await tmdb_request(
    `/collection/${id}`,
  )) as ITmdbMovieCollection | null;
};
