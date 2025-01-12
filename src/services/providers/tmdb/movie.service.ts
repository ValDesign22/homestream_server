import { distance } from 'fastest-levenshtein';
import { tmdb_request } from '.';
import { IGenre, IMovie } from '../../../utils/types/interfaces.util';

export const search_movie = async (
  title: string,
  year: string | null,
): Promise<IMovie | null> => {
  const response = await tmdb_request('/search/movie', { query: title, year });
  if (!response || !response.results || response.results.length === 0)
    return null;

  let best_match = null;
  let lowest_distance = Number.MAX_SAFE_INTEGER;
  for (const movie of response.results) {
    const distance_result = distance(title, movie.title);
    if (distance_result < lowest_distance) {
      lowest_distance = distance_result;
      best_match = movie;
    }
  }

  const movie_id = best_match.id;

  const movie_response = await tmdb_request(`/movie/${movie_id}`, {
    append_to_response: 'images',
  });
  if (!movie_response) return null;

  const genres: IGenre[] = movie_response.genres
    ? movie_response.genres.map((genre: { id: number; name: string }) => {
        return {
          id: genre.id,
          name: genre.name,
        };
      })
    : [];

  return {
    id: movie_response.id,
    collection_id: movie_response.belongs_to_collection
      ? movie_response.belongs_to_collection.id
      : null,
    title: movie_response.title,
    original_title: movie_response.original_title,
    overview: movie_response.overview,
    poster_path: movie_response.poster_path,
    backdrop_path: movie_response.backdrop_path,
    logo_path:
      movie_response.images.logos.length > 0
        ? movie_response.images.logos[0].file_path
        : null,
    release_date: movie_response.release_date,
    runtime: movie_response.runtime,
    genres,
    path: null,
  };
};
