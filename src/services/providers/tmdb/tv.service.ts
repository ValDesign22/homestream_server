import { distance } from 'fastest-levenshtein';
import { tmdb_request } from '#/services/providers/tmdb/index';
import { ITmdbGenre } from '#/utils/types/tmdb.types';
import { IGenre, ITvShow } from '#/utils/types/interfaces.util';

export const search_tvshow = async (
  title: string,
  year: string | null,
): Promise<ITvShow | null> => {
  const response = await tmdb_request('/search/tv', { query: title, year });
  if (!response || !response.results || response.results.length === 0)
    return null;

  let best_match = null;
  let lowest_distance = Number.MAX_SAFE_INTEGER;
  for (const tvshow of response.results) {
    const distance_result = distance(title, tvshow.name);
    if (distance_result < lowest_distance) {
      lowest_distance = distance_result;
      best_match = tvshow;
    }
  }

  const tvshow_id = best_match.id;

  const tvshow_response = await tmdb_request(`/tv/${tvshow_id}`, {
    append_to_response: 'images',
  });
  if (!tvshow_response) return null;

  const genres: IGenre[] = tvshow_response.genres
    ? tvshow_response.genres.map((genre: ITmdbGenre) => {
        return {
          id: genre.id,
          name: genre.name,
        };
      })
    : [];

  return {
    id: tvshow_response.id,
    title: tvshow_response.name,
    original_title: tvshow_response.original_name,
    overview: tvshow_response.overview,
    poster_path: tvshow_response.poster_path,
    backdrop_path: tvshow_response.backdrop_path,
    logo_path:
      tvshow_response.images.logos.length > 0
        ? tvshow_response.images.logos[0].file_path
        : null,
    genres,
    seasons: [],
  };
};

export const search_tvshow_season = async (
  tvshow_id: number,
  season_number: number,
): Promise<ITvShow | null> => {
  const response = await tmdb_request(
    `/tv/${tvshow_id}/season/${season_number}`,
    { append_to_response: 'images' },
  );
  if (!response) return null;

  const genres: IGenre[] = response.genres
    ? response.genres.map((genre: ITmdbGenre) => {
        return {
          id: genre.id,
          name: genre.name,
        };
      })
    : [];

  return {
    id: response.id,
    title: response.name,
    original_title: response.original_name,
    overview: response.overview,
    poster_path: response.poster_path,
    backdrop_path: response.backdrop_path,
    logo_path:
      response.images.logos.length > 0
        ? response.images.logos[0].file_path
        : null,
    genres,
    seasons: [],
  };
};
