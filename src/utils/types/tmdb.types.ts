export interface ITmdbMovie {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: ITmdbMovieCollection | null;
  budget: number;
  genres: ITmdbGenre[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: ITmdbProductionCompany[];
  production_countries: ITmdbProductionCountry[];
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages: ITmdbSpokenLanguage[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  images: ITmdbImages;
}

export interface ITmdbMovieCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
}

export interface ITmdbTvShow {
  adult: boolean;
  backdrop_path: string;
  created_by: ITmdbTvShowCreator[];
  episode_run_time: number[];
  first_air_date: string;
  genres: ITmdbGenre[];
  homepage: string;
  id: number;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: ITmdbTvShowEpisode;
  name: string;
  next_episode_to_air: ITmdbTvShowEpisode;
  networks: ITmdbProductionCompany[];
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: ITmdbProductionCompany[];
  production_countries: ITmdbProductionCountry[];
  seasons: ITmdbTvShowSeason[];
  spoken_languages: ITmdbSpokenLanguage[];
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
  images: ITmdbImages;
}

export interface ITmdbTvShowEpisode {
  air_date: string;
  crew: ITmdbTvShowCrew[];
  episode_number: number;
  guest_stars: ITmdbTvShowGuestStar[];
  name: string;
  overview: string;
  id: number;
  production_code: string;
  runtime: number;
  season_number: number;
  still_path: string;
  vote_average: number;
  vote_count: number;
  images: ITmdbImages;
}

export interface ITmdbTvShowSeason {
  _id: string;
  air_date: string;
  episodes: ITmdbTvShowEpisode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string;
  season_number: number;
  vote_average: number;
  vote_count: number;
  images: ITmdbImages;
}

export interface ITmdbGenre {
  id: number;
  name: string;
}

export interface ITmdbProductionCompany {
  description: string;
  headquarters: string;
  homepage: string;
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
  parent_company: ITmdbProductionCompany | null;
}

export interface ITmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface ITmdbSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface ITmdbImages {
  backdrops?: ITmdbImage[];
  logos?: ITmdbImage[];
  posters?: ITmdbImage[];
  stills?: ITmdbImage[];
}

export interface ITmdbImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface ITmdbTvShowCreator {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string;
}

export interface ITmdbTvShowCrew {
  department: string;
  job: string;
  credit_id: string;
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
}

export interface ITmdbTvShowGuestStar {
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
}
