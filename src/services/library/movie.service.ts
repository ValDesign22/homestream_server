import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load_config } from '../config.service';
import { get_item, load_store, store_item } from '../store.service';
import {
  BACKDROP_FILENAME,
  LOGO_FILENAME,
  POSTER_FILENAME,
  VIDEO_EXTENSIONS,
} from '../../utils/constants.util';
import { EImageType, EMediaType } from '../../utils/types/enums.util';
import { IConfig, IFolder, IMovie } from '../../utils/types/interfaces.util';
import logger from '../logger.service';
import { search_movie } from '../providers/tmdb/movie.service';
import { download_images_concurrently } from '.';

export const get_movie_image = (
  folder: IFolder,
  id: number,
  image_type: EImageType,
): string | null => {
  const item = get_item(folder, id);
  if (!item) return null;

  const image_path = join(
    item.path,
    image_type === EImageType.Backdrop
      ? BACKDROP_FILENAME
      : image_type === EImageType.Logo
        ? LOGO_FILENAME
        : POSTER_FILENAME,
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

export const get_movie = (id: number): IMovie | null => {
  const config = load_config();
  if (!config) return null;

  for (const folder of config.folders) {
    if (folder.media_type === EMediaType.Movies) {
      const movie = get_item(folder, id);
      if (movie) return movie.metadata as IMovie;
    }
  }

  return null;
};

const parse_movie_filename = (
  filename: string,
): { title: string; year: string | null } => {
  const regex = /^(.*?)(?:\s+(\d{4}))?$/;
  const match = filename.match(regex);

  if (!match) return { title: filename, year: null };

  const title = match[1].trim();
  const year = match[2] || null;

  return { title, year };
};

export const analyze_movies = async (
  folder: IFolder,
  { save_images }: IConfig,
): Promise<void> => {
  const stack: string[] = [folder.path];

  const movies = load_store(folder) as { path: string; metadata: IMovie }[];
  const images: { url: string; path: string }[] = [];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        if (item.name !== '.' && item.name !== '..')
          stack.push(join(current_path, item.name));
        continue;
      }

      if (!VIDEO_EXTENSIONS.includes(item.name.split('.').pop() as string))
        continue;

      const existing_movie = movies.find(
        (movie) => movie.metadata.path === current_path,
      );
      if (existing_movie) continue;

      const filename = item.name.split('.').shift() as string;
      const { title, year } = parse_movie_filename(filename);
      const full_path = join(current_path, item.name);

      logger.info(
        `Analyzing movie: ${full_path}\n${title} (${year || 'Unknown Year'})`,
      );

      try {
        const tmdb_movie = await search_movie(title, year);
        if (tmdb_movie) {
          if (!get_item(folder, tmdb_movie.id))
            store_item(folder, {
              ...tmdb_movie,
              path: full_path,
            });

          const movie = get_item(folder, tmdb_movie.id);
          if (movie && save_images) {
            if (tmdb_movie.backdrop_path)
              images.push({
                url: `https://image.tmdb.org/t/p/original${tmdb_movie.backdrop_path}`,
                path: join(movie.path, BACKDROP_FILENAME),
              });
            if (tmdb_movie.logo_path)
              images.push({
                url: `https://image.tmdb.org/t/p/original${tmdb_movie.logo_path}`,
                path: join(movie.path, LOGO_FILENAME),
              });
            if (tmdb_movie.poster_path)
              images.push({
                url: `https://image.tmdb.org/t/p/original${tmdb_movie.poster_path}`,
                path: join(movie.path, POSTER_FILENAME),
              });
          }

          logger.info(
            `Analyzed movie: ${full_path}\n${tmdb_movie.title} (${tmdb_movie.release_date.split('-')[0]})`,
          );
        }
      } catch (error) {
        logger.error(
          `Failed to search for movie: ${full_path}\n${title} (${year || 'Unknown Year'})`,
          error,
        );
      }
    }
  }

  await download_images_concurrently(images);
};
