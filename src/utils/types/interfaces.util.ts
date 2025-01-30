import { EMediaType } from '#/utils/types/enums.util';
import {
  ITmdbMovie,
  ITmdbTvShow,
  ITmdbTvShowEpisode,
  ITmdbTvShowSeason,
} from './tmdb.types';

export interface IConfig {
  files_folder: string;
  folders: IFolder[];
  tmdb_language: string;
  save_images: boolean;
  create_collections: boolean;
}

export interface IFolder {
  id: number;
  name: string;
  path: string;
  generate_trickplay: boolean;
  media_type: EMediaType;
}

export interface IMovie {
  metadata: ITmdbMovie;
  path: string;
  media_type: EMediaType;
  backdrop_path: string | null;
  logo_path: string | null;
  poster_path: string | null;
  added_at: string;
}

export interface ITvShow {
  metadata: ITmdbTvShow;
  media_type: EMediaType;
  backdrop_path: string | null;
  logo_path: string | null;
  poster_path: string | null;
}

export interface ITvShowSeason {
  metadata: ITmdbTvShowSeason;
  poster_path: string | null;
}

export interface ITvShowEpisode {
  metadata: ITmdbTvShowEpisode;
  path: string | null;
  still_path: string | null;
}
