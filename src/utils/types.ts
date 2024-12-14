export interface IConfig {
  app_storage_path: string;
  files_folder: string;
  watch_dir?: string;
  folders: IFolder[];
  tmdb_api_key: string;
  tmdb_language: string;
  hardware_acceleration: boolean;
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
}

export interface ITvShowSeason {
  id: number,
  season_number: number,
  name: string,
  overview: string,
  episodes: ITvShowEpisode[],
  poster_path: string | null,
}

export interface ITvShowEpisode {
  id: number,
  episode_number: number,
  title: string,
  overview: string,
  air_date: string,
  still_path: string | null,
  runtime: number,
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

export interface IProfile {
  id: number,
  name: string,
  password?: string,
  role: ERole,
  history: IHistory[],
  watchlist: (IMovie | ITvShow)[],
  favorites: (IMovie | ITvShow)[],
}

export enum ERole {
  Admin,
  User,
}

export interface IHistory {
  id: number,
  date: string,
  title: string,
  media_type: EMediaType,
  watched: boolean,
  progress: number,
}

export interface INotification {
  profile_id: number,
  media_type: EMediaType,
  notification_type: ENotificationType,
  data: IMovie | ITvShow,
}

export enum ENotificationType {
  Watchlist,
  Favorites,
}

export interface ITracks {
  audios: ITrack[],
  subtitles: ITrack[],
}

export interface ITrack {
  index: number,
  codec_name?: string,
  codec_type?: string,
  channel_layout?: string,
  language: string,
  handler_name?: string,
  default?: boolean,
  url?: string,
}
