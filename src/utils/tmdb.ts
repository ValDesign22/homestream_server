import axios from 'axios';
import { distance } from 'fastest-levenshtein';
import { EMediaType, IConfig, IGenre, IImagesResponse, IMovie, ITvShow, ITvShowEpisode, ITvShowSeason } from './types';
import { load_config } from './config';

const create_request = async (url: string) => {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is not defined');

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (response.status !== 200) throw new Error('Request failed');
  return response.data;
};

const find_image_path = (images: any[], language: string | null): string | null => {
  for (const image of images) if (image.iso_639_1 === language) return image.file_path;
  return null;
};

const fetch_images = async (id: number, media_type: EMediaType, config: IConfig): Promise<IImagesResponse> => {
  let base_url;
  switch (media_type) {
    case EMediaType.Movies:
      base_url = 'https://api.themoviedb.org/3/movie';
      break;
    case EMediaType.TvShows:
      base_url = 'https://api.themoviedb.org/3/tv';
      break;
  }

  const images = await create_request(`${base_url}/${id}/images`);

  const { tmdb_language } = config;

  return {
    backdrop_path: find_image_path(images.backdrops, null),
    logo_path: find_image_path(images.logos, tmdb_language) || find_image_path(images.logos, 'en') || find_image_path(images.logos, null),
    poster_path: find_image_path(images.posters, tmdb_language) || find_image_path(images.posters, 'en') || find_image_path(images.posters, null),
  };
};

const search = async (title: string, type: string): Promise<IMovie[] | ITvShow[]> => {
  const config = load_config();
  const { tmdb_language } = config;

  if (!title || !type) return [];

  const url = `https://api.themoviedb.org/3/search/${type}?query=${title}&language=${tmdb_language}`;

  const response = await create_request(url);

  if (!response.results || response.results.length === 0) return [];

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
        };
      });
      break;
    case 'tv':
      results = response.results.map((tvshow: any) => {
        return {
          id: tvshow.id,
          title: tvshow.name,
          original_title: tvshow.original_name,
          overview: tvshow.overview,
          poster_path: tvshow.poster_path,
          backdrop_path: tvshow.backdrop_path,
          logo_path: tvshow.logo_path,
          genres: tvshow.genres ? tvshow.genres.map((genre: any) => {
            return {
              id: genre.id,
              name: genre.name,
            };
          }) : [],
        };
      });
      break;
  }

  return results;
}

const search_movie = async (title: string, date: string | null, config: IConfig): Promise<IMovie | null> => {
  const { tmdb_language } = config;

  const search_results = (await create_request(`https://api.themoviedb.org/3/search/movie?query=${title}&language=${tmdb_language}${date ? `&year=${date}` : ''}`)).results;
  if (!search_results || search_results.length === 0) return null;

  let best_match = null;
  let lowest_distance = Number.MAX_SAFE_INTEGER;

  for (const result of search_results) {
    let distanceResult = distance(title, result.title);
    if (distanceResult < lowest_distance) {
      lowest_distance = distanceResult;
      best_match = result;
    }
  }

  const movie_id = best_match.id;

  const movie_response = await create_request(`https://api.themoviedb.org/3/movie/${movie_id}?language=${tmdb_language}&append_to_response=release_dates`);
  if (!movie_response) return null;

  const genres: IGenre[] = movie_response.genres ? movie_response.genres.map((genre: any) => {
    return {
      id: genre.id,
      name: genre.name,
    };
  }) : [];

  const images = await fetch_images(movie_id, EMediaType.Movies, config);

  return {
    id: movie_response.id,
    collection_id: movie_response.belongs_to_collection ? movie_response.belongs_to_collection.id : null,
    title: movie_response.title,
    original_title: movie_response.original_title,
    overview: movie_response.overview,
    poster_path: images.poster_path,
    backdrop_path: images.backdrop_path,
    logo_path: images.logo_path,
    release_date: movie_response.release_date,
    runtime: movie_response.runtime,
    genres,
    path: null,
  };
};

const search_tvshow = async (title: string, date: string | null, config: IConfig): Promise<ITvShow | null> => {
  const { tmdb_language } = config;

  const search_results = (await create_request(`https://api.themoviedb.org/3/search/tv?query=${title}&language=${tmdb_language}${date ? `&first_air_date_year=${date}` : ''}`)).results;
  if (!search_results || search_results.length === 0) return null;

  let best_match = null;
  let lowest_distance = Number.MAX_SAFE_INTEGER;

  for (const result of search_results) {
    let distanceResult = distance(title, result.name);
    if (distanceResult < lowest_distance) {
      lowest_distance = distanceResult;
      best_match = result;
    }
  }

  const tvshow_id = best_match.id;

  const tvshow_response = await create_request(`https://api.themoviedb.org/3/tv/${tvshow_id}?language=${tmdb_language}&append_to_response=release_dates`);
  if (!tvshow_response) return null;

  const genres: IGenre[] = tvshow_response.genres ? tvshow_response.genres.map((genre: any) => {
    return {
      id: genre.id,
      name: genre.name,
    };
  }) : [];

  const images = await fetch_images(tvshow_id, EMediaType.TvShows, config);

  return {
    id: tvshow_response.id,
    title: tvshow_response.name,
    original_title: tvshow_response.original_name,
    overview: tvshow_response.overview,
    poster_path: images.poster_path,
    backdrop_path: images.backdrop_path,
    logo_path: images.logo_path,
    genres,
    seasons: [],
    path: null,
  };
};

const search_tvshow_season = async (tvshow_id: number, season_number: number, config: IConfig): Promise<ITvShowSeason | null> => {
  const { tmdb_language } = config;

  const season_response = await create_request(`https://api.themoviedb.org/3/tv/${tvshow_id}/season/${season_number}?language=${tmdb_language}`);
  if (!season_response) return null;

  const images = await create_request(`https://api.themoviedb.org/3/tv/${tvshow_id}/season/${season_number}/images`);

  return {
    id: season_response.id,
    season_number: season_response.season_number,
    name: season_response.name,
    overview: season_response.overview,
    episodes: [],
    poster_path: find_image_path(images.posters, tmdb_language) || find_image_path(images.posters, 'en') || find_image_path(images.posters, null),
    path: null,
  };
};

const search_tvshow_episode = async (tvshow_id: number, season_number: number, episode_number: number, config: IConfig): Promise<ITvShowEpisode | null> => {
  const { tmdb_language } = config;

  const episode_response = await create_request(`https://api.themoviedb.org/3/tv/${tvshow_id}/season/${season_number}/episode/${episode_number}?language=${tmdb_language}`);
  if (!episode_response) return null;

  const images = await create_request(`https://api.themoviedb.org/3/tv/${tvshow_id}/season/${season_number}/episode/${episode_number}/images`);

  return {
    id: episode_response.id,
    episode_number: episode_response.episode_number,
    title: episode_response.name,
    overview: episode_response.overview,
    air_date: episode_response.air_date,
    still_path: find_image_path(images.stills, tmdb_language) || find_image_path(images.stills, 'en') || find_image_path(images.stills, null),
    runtime: episode_response.runtime,
    path: null,
  };
};

const search_video = async (id: number, media_type: EMediaType, config: IConfig): Promise<string | null> => {
  let base_url;
  switch (media_type) {
    case EMediaType.Movies:
      base_url = 'https://api.themoviedb.org/3/movie';
      break;
    case EMediaType.TvShows:
      base_url = 'https://api.themoviedb.org/3/tv';
      break;
  }

  const videos = await create_request(`${base_url}/${id}/videos?language=${config.tmdb_language}`);
  if (!videos || !videos.results || videos.results.length === 0) return null;

  for (const video of videos.results) if (video.type === 'Trailer' && video.site === 'YouTube') return video.key;

  return null;
};

export { create_request, fetch_images, search, search_movie, search_tvshow, search_tvshow_season, search_tvshow_episode, search_video };
