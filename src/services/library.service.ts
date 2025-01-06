import axios from "axios";
import { createWriteStream, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { get_collection, get_item, load_store, store_collection, store_item } from "./store.service";
import { search_collection, search_movie } from "./tmdb.service";
import { get_config_path } from "./config.service";
import { BACKDROP_FILENAME, LOGO_FILENAME, POSTER_FILENAME, VIDEO_EXTENSIONS } from "../utils/constants.util";
import { EImageType, EMediaType, IConfig, IFolder, IMovie, IMovieCollection } from "../utils/types";

export const get_library_path = (folder: IFolder): string => {
  const libraries_path = join(get_config_path(), 'libraries', folder.id.toString());
  if (!existsSync(libraries_path)) mkdirSync(libraries_path, { recursive: true });
  return libraries_path;
};

const download_image = async (url: string, path: string): Promise<void> => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = createWriteStream(path);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download image from URL: ${url}`, error);
  }
};

export const get_image = (folder: IFolder, id: number, image_type: EImageType): string | null => {
  const item = get_item(folder, id);
  if (!item) return null;

  const image_path = join(
    item.path,
    image_type === EImageType.Backdrop
      ? BACKDROP_FILENAME
      : image_type === EImageType.Logo
        ? LOGO_FILENAME
        : POSTER_FILENAME
  );

  const exists = existsSync(image_path);
  switch (image_type) {
    case EImageType.Backdrop:
      return exists
        ? image_path
        : item.metadata.backdrop_path
          ? `https://image.tmdb.org/t/p/original${item.metadata.backdrop_path}`
          : null;
    case EImageType.Logo:
      return exists
        ? image_path
        : item.metadata.logo_path
          ? `https://image.tmdb.org/t/p/original${item.metadata.logo_path}`
          : null;
    case EImageType.Poster:
      return exists
        ? image_path
        : item.metadata.poster_path
          ? `https://image.tmdb.org/t/p/original${item.metadata.poster_path}`
          : null;
    default:
      return null;
  }
};

const parse_movie_filename = (filename: string): { title: string, year: string | null } => {
  const regex = /^(.*?)(?:\s+(\d{4}))?$/;
  const match = filename.match(regex);

  if (!match) return { title: filename, year: null };

  const title = match[1].trim();
  const year = match[2] || null;

  return { title, year };
};

const parse_tvshow_filename = (filename: string): { title: string, year: string | null, season: string, episode: string } | null => {
  const regex = /^(.*?)\s*(?:\((\d{4})\))?\s*S(\d{2})\s*E(\d{2})$/;
  const match = filename.match(regex);

  if (!match) return null;

  const [_, title, year, season, episode] = match;

  return { title, year, season, episode };
};

const analyze_movies = async (folder: IFolder, { save_images }: IConfig): Promise<void> => {
  const stack: string[] = [folder.path];

  const movies = load_store(folder) as { path: string, metadata: IMovie }[];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        if (item.name !== '.' && item.name !== '..') stack.push(join(current_path, item.name));
        continue;
      }

      if (!VIDEO_EXTENSIONS.includes(item.name.split('.').pop() as string)) continue;

      const existing_movie = movies.find((movie) => movie.metadata.path === current_path);
      if (existing_movie) continue;

      const filename = item.name.split('.').shift() as string;
      const { title, year } = parse_movie_filename(filename);
      const full_path = join(current_path, item.name);

      console.log(`Analyzing movie: ${full_path}\n${title} (${year || 'Unknown Year'})`);

      try {
        const tmdb_movie = await search_movie(title, year);
        if (tmdb_movie) {
          if (!get_item(folder, tmdb_movie.id)) store_item(folder, {
            ...tmdb_movie,
            path: full_path,
          });

          const movie = get_item(folder, tmdb_movie.id);
          if (movie && save_images) {
            if (tmdb_movie.backdrop_path) await download_image(
              `https://image.tmdb.org/t/p/original${tmdb_movie.backdrop_path}`,
              join(movie.path, BACKDROP_FILENAME)
            );
            if (tmdb_movie.logo_path) await download_image(
              `https://image.tmdb.org/t/p/original${tmdb_movie.logo_path}`,
              join(movie.path, LOGO_FILENAME)
            );
            if (tmdb_movie.poster_path) await download_image(
              `https://image.tmdb.org/t/p/original${tmdb_movie.poster_path}`,
              join(movie.path, POSTER_FILENAME)
            );
          }

          console.log(`Analyzed movie: ${full_path}\n${tmdb_movie.title} (${tmdb_movie.release_date.split('-')[0]})`);
        }
      } catch (error) {
        console.error(`Failed to search for movie: ${full_path}\n${title} (${year || 'Unknown Year'})`, error);
      }
    }
  }
};

const analyze_tvshows = async (folder: IFolder, { save_images }: IConfig): Promise<void> => {
  // TODO: Implement TV Shows analysis
  return;
};

export const analyze_library = async (folder: IFolder, config: IConfig): Promise<void> => {
  switch (folder.media_type) {
    case EMediaType.Movies:
      await analyze_movies(folder, config);
    case EMediaType.TvShows:
      await analyze_tvshows(folder, config);
  }
};
