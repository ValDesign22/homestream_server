import axios, { AxiosResponse } from 'axios';
import { load_config } from '#/services/config.service';
import logger from '#/services/logger.service';
import { TMDB_API_KEY } from '#/utils/constants.util';
import { ITmdbMovie, ITmdbTvShow } from '#/utils/types/tmdb.types';

export const tmdb_request = async (
  path: string,
  params?: Record<string, string | null>,
): Promise<AxiosResponse['data'] | null> => {
  const config = load_config();
  if (!config) return null;
  try {
    const url_params = new URLSearchParams(
      Object.entries({
        api_key: TMDB_API_KEY,
        language: config.tmdb_language,
        ...params,
      }),
    ).toString();
    const response = await axios({
      url: `https://api.themoviedb.org/3${path}?${url_params}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (response.status !== 200) return null;
    return response.data;
  } catch (error) {
    logger.error('Failed to make request to TMDB:');
    logger.error(error);
    return null;
  }
};

export const tmdb_search = async (
  query: string,
  type: 'movie' | 'tv',
): Promise<ITmdbMovie[] | ITmdbTvShow[]> => {
  const response = await tmdb_request(`/search/${type}`, { query });
  return response?.results ?? [];
};
