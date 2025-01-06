import axios from "axios";
import { load_config } from "./config.service";
import { TMDB_API_KEY } from "../utils/constants.util";
import { IGenre, IMovie, IMovieCollection, ITvShow } from "../utils/types";
import { distance } from "fastest-levenshtein";

export const tmdb_request = async (path: string, params?: Record<string, string | null>): Promise<any | null> => {
  const config = load_config();
  if (!config) return null;
  try {
    const url_params = new URLSearchParams(Object.entries({
      api_key: TMDB_API_KEY,
      language: config.tmdb_language,
      ...params,
    })).toString();
    const response = await axios({
      url: `https://api.themoviedb.org/3${path}?${url_params}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (response.status !== 200) return null;
    return response.data;
  } catch (error) {
    console.error('Failed to make request to TMDB:', error);
    return null;
  }
};

export const search_movie = async (title: string, year: string | null): Promise<IMovie | null> => {
  const response = await tmdb_request('/search/movie', { query: title, year });
  if (!response || !response.results || response.results.length === 0) return null;

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

  const movie_response = await tmdb_request(`/movie/${movie_id}`, { append_to_response: 'images' });
  if (!movie_response) return null;

  const genres: IGenre[] = movie_response.genres ? movie_response.genres.map((genre: any) => {
    return {
      id: genre.id,
      name: genre.name,
    };
  }) : [];

  return {
    id: movie_response.id,
    collection_id: movie_response.belongs_to_collection ? movie_response.belongs_to_collection.id : null,
    title: movie_response.title,
    original_title: movie_response.original_title,
    overview: movie_response.overview,
    poster_path: movie_response.poster_path,
    backdrop_path: movie_response.backdrop_path,
    logo_path: movie_response.images.logos.length > 0 ? movie_response.images.logos[0].file_path : null,
    release_date: movie_response.release_date,
    runtime: movie_response.runtime,
    genres,
    path: null,
  };
};

export const search_collection = async (id: number): Promise<IMovieCollection | null> => {
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

export const search = async (query: string, type: string): Promise<IMovie[] | ITvShow[]> => {
  const response = await tmdb_request(`/search/${type}`, { query });
  if (!response || !response.results || response.results.length === 0) return [];

  let results: IMovie[] | ITvShow[] = [];

  switch (type) {
    case 'movie':
      results = response.results.map((movie: any) => {
        return {
          id: movie.id,
          collection_id: movie.belongs_to_collection ? movie.belongs_to_collection.id : null,
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          logo_path: movie.logo_path,
          release_date: movie.release_date,
          runtime: movie.runtime,
          genres: movie.genres ? movie.genres.map((genre: any) => {
            return {
              id: genre.id,
              name: genre.name,
            };
          }) : [],
        }
      });
      break;
    default:
      results = [];
  }

  return results;
};
