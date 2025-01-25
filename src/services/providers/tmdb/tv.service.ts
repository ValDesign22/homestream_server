import { distance } from 'fastest-levenshtein';
import { tmdb_request } from '#/services/providers/tmdb/index';
import {
  ITmdbTvShow,
  ITmdbTvShowEpisode,
  ITmdbTvShowSeason,
} from '#/utils/types/tmdb.types';

export const search_tvshow = async (
  title: string,
  year: string | null,
): Promise<ITmdbTvShow | null> => {
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

  return (await tmdb_request(`/tv/${tvshow_id}`, {
    append_to_response: 'images',
  })) as ITmdbTvShow | null;
};

export const search_tvshow_season = async (
  tvshow_id: number,
  season_number: number,
): Promise<ITmdbTvShowSeason | null> => {
  return (await tmdb_request(`/tv/${tvshow_id}/season/${season_number}`, {
    append_to_response: 'images',
  })) as ITmdbTvShowSeason | null;
};

export const search_tvshow_episode = async (
  tvshow_id: number,
  season_number: number,
  episode_number: number,
): Promise<ITmdbTvShowEpisode | null> => {
  return (await tmdb_request(
    `/tv/${tvshow_id}/season/${season_number}/episode/${episode_number}`,
    { append_to_response: 'images' },
  )) as ITmdbTvShowEpisode | null;
};
