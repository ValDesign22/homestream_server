export interface IConfig {
  folders: IFolder[];
  tmdb_language: string;
}

export interface IFolder {
  id: number,
  name: string,
  path: string,
  media_type: EMediaType,
}

export interface IMovie {
  id: number,
  collection_id: number,
  title: string,
  original_title: string,
  overview: string,
  poster_path: string | null,
  backdrop_path: string | null,
  logo_path: string | null,
  release_date: string,
  runtime: number,
  genres: IGenre[],
  path: string | null,
}

export interface ITvShow {
  id: number,
  title: string,
  original_title: string,
  overview: string,
  poster_path: string | null,
  backdrop_path: string | null,
  logo_path: string | null,
  genres: IGenre[],
  seasons: ITvShowSeason[],
  path: string | null,
}

export interface ITvShowSeason {
  id: number,
  season_number: number,
  name: string,
  overview: string,
  episodes: ITvShowEpisode[],
  poster_path: string | null,
  path: string | null,
}

export interface ITvShowEpisode {
  id: number,
  episode_number: number,
  title: string,
  overview: string,
  air_date: string,
  still_path: string | null,
  path: string | null,
}

export interface IGenre {
  id: number,
  name: string,
}

export interface IImagesResponse {
  backdrop_path: string | null,
  logo_path: string | null,
  poster_path: string | null,
}

export enum EMediaType {
  Movies,
  TvShows,
}
