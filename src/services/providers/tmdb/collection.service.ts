import { tmdb_request } from '#/services/providers/tmdb/index';
import { IMovieCollection } from '#/utils/types/interfaces.util';
import { ITmdbMovieCollection } from '#/utils/types/tmdb.types';

export const search_collection = async (
  id: number,
): Promise<IMovieCollection | null> => {
  const response = (await tmdb_request(
    `/collection/${id}`,
  )) as ITmdbMovieCollection | null;
  if (!response) return null;

  return {
    id: response.id,
    name: response.name,
    overview: response.overview,
    poster_path: response.poster_path,
    backdrop_path: response.backdrop_path,
  };
};
