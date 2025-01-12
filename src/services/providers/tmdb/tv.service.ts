import { distance } from 'fastest-levenshtein';
import { tmdb_request } from '#/services/providers/tmdb/index';
import {
  ITmdbGenre,
  ITmdbTvShow,
  ITmdbTvShowEpisode,
  ITmdbTvShowSeason,
} from '#/utils/types/tmdb.types';
import {
  IGenre,
  ITvShow,
  ITvShowEpisode,
  ITvShowSeason,
} from '#/utils/types/interfaces.util';

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

  const tvshow_response = (await tmdb_request(`/tv/${tvshow_id}`, {
    append_to_response: 'images',
  })) as ITmdbTvShow | null;
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
      tvshow_response.images.logos && tvshow_response.images.logos.length > 0
        ? tvshow_response.images.logos[0].file_path
        : null,
    genres,
    seasons: [],
  };
};

export const search_tvshow_season = async (
  tvshow_id: number,
  season_number: number,
): Promise<ITvShowSeason | null> => {
  const response = (await tmdb_request(
    `/tv/${tvshow_id}/season/${season_number}`,
    { append_to_response: 'images' },
  )) as ITmdbTvShowSeason | null;
  if (!response) return null;

  return {
    id: response.id,
    season_number: response.season_number,
    name: response.name,
    overview: response.overview,
    poster_path: response.poster_path,
    episodes: [],
  };
};

export const search_tvshow_episode = async (
  tvshow_id: number,
  season_number: number,
  episode_number: number,
): Promise<ITvShowEpisode | null> => {
  const response = (await tmdb_request(
    `/tv/${tvshow_id}/season/${season_number}/episode/${episode_number}`,
    { append_to_response: 'images' },
  )) as ITmdbTvShowEpisode | null;
  if (!response) return null;

  return {
    id: response.id,
    episode_number: response.episode_number,
    title: response.name,
    overview: response.overview,
    air_date: response.air_date,
    still_path: response.still_path,
    runtime: response.runtime,
    path: null,
  };
};
