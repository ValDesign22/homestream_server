import { distance } from 'fastest-levenshtein';
import { tmdb_request } from '#/services/providers/tmdb/index';
import { ITmdbMovie } from '#/utils/types/tmdb.types';

export const search_movie = async (
  title: string,
  year: string | null,
): Promise<ITmdbMovie | null> => {
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

  return (await tmdb_request(`/movie/${movie_id}`, {
    append_to_response: 'images',
  })) as ITmdbMovie | null;
};
