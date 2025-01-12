import { tmdb_request } from '.';
import { IMovieCollection } from '../../../utils/types/interfaces.util';

export const search_collection = async (
  id: number,
): Promise<IMovieCollection | null> => {
  const response = await tmdb_request(`/collection/${id}`);
  if (!response) return null;

  return {
    id: response.id,
    name: response.name,
    overview: response.overview,
    poster_path: response.poster_path,
    backdrop_path: response.backdrop_path,
  };
};
