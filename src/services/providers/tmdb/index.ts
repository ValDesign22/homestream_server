import axios from 'axios';
import { load_config } from '../../config.service';
import logger from '../../logger.service';
import { TMDB_API_KEY } from '../../../utils/constants.util';
import { IMovie, ITvShow } from '../../../utils/types/interfaces.util';
import {
  ITmdbGenre,
  ITmdbMovie,
  ITmdbTvShow,
} from '../../../utils/types/tmdb.types';

export const tmdb_request = async (
  path: string,
  params?: Record<string, string | null>,
): Promise<any | null> => {
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
    logger.error('Failed to make request to TMDB:', error);
    return null;
  }
};

export const tmdb_search = async (
  query: string,
  type: string,
): Promise<IMovie[] | ITvShow[]> => {
  const response = await tmdb_request(`/search/${type}`, { query });
  if (!response || !response.results || response.results.length === 0)
    return [];

  switch (type) {
    case 'movie':
      return response.results.map((movie: ITmdbMovie) => {
        return {
          id: movie.id,
          collection_id: movie.belongs_to_collection
            ? movie.belongs_to_collection.id
            : null,
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          logo_path: null,
          release_date: movie.release_date,
          runtime: movie.runtime,
          genres: movie.genres
            ? movie.genres.map((genre: ITmdbGenre) => {
                return {
                  id: genre.id,
                  name: genre.name,
                };
              })
            : [],
        };
      }) as IMovie[];
    case 'tv':
      return response.results.map((tv_show: ITmdbTvShow) => {
        return {
          id: tv_show.id,
          title: tv_show.name,
          original_title: tv_show.original_name,
          overview: tv_show.overview,
          poster_path: tv_show.poster_path,
          backdrop_path: tv_show.backdrop_path,
          file_path: null,
          logo_path: null,
          genres: tv_show.genres
            ? tv_show.genres.map((genre: ITmdbGenre) => {
                return {
                  id: genre.id,
                  name: genre.name,
                };
              })
            : [],
          seasons: [],
        };
      }) as ITvShow[];
    default:
      return [];
  }
};
