import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { load_config } from '#/services/config.service';
import { get_item, load_store, store_item } from '#/services/store.service';
import {
  BACKDROP_FILENAME,
  LOGO_FILENAME,
  POSTER_FILENAME,
  VIDEO_EXTENSIONS,
} from '#/utils/constants.util';
import { EImageType, EMediaType } from '#/utils/types/enums.util';
import { IConfig, IFolder, IMovie } from '#/utils/types/interfaces.util';
import logger from '#/services/logger.service';
import { search_movie } from '#/services/providers/tmdb/movie.service';
import { download_images_concurrently } from '#/services/library/index';

export const get_movie_image = (
  id: number,
  image_type: EImageType,
): string | null => {
  const item = get_movie(id);
  if (!item) return null;

  const filename_map = {
    [EImageType.Backdrop]: BACKDROP_FILENAME,
    [EImageType.Logo]: LOGO_FILENAME,
    [EImageType.Poster]: POSTER_FILENAME,
  };

  const metadata_map = {
    [EImageType.Backdrop]: item.metadata.backdrop_path,
    [EImageType.Logo]: item.metadata.logo_path,
    [EImageType.Poster]: item.metadata.poster_path,
  };

  const image_path = join(item.path, filename_map[image_type]);
  const exists = existsSync(image_path);

  return exists
    ? image_path
    : metadata_map[image_type]
      ? `https://image.tmdb.org/t/p/original${metadata_map[image_type]}`
      : null;
};

export const get_movie = (
  id: number,
): { metadata: IMovie; path: string } | null => {
  const config = load_config();
  if (!config) return null;

  const folder = config.folders.find(
    (folder) => folder.media_type === EMediaType.Movies && get_item(folder, id),
  );
  return folder
    ? (get_item(folder, id) as { metadata: IMovie; path: string })
    : null;
};

const parse_movie_filename = (
  filename: string,
): { title: string; year: string | null } => {
  const match = filename.match(/^(.*?)(?:\s+(\d{4}))?$/);

  if (!match) return { title: filename, year: null };

  const [, title, year] = match;

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
              metadata: tmdb_movie,
              path: join(current_path, item.name),
              media_type: EMediaType.Movies,
              backdrop_path: tmdb_movie.backdrop_path || null,
              logo_path:
                tmdb_movie.images.logos && tmdb_movie.images.logos.length > 0
                  ? tmdb_movie.images.logos[0].file_path
                  : null,
              poster_path: tmdb_movie.poster_path || null,
              added_at: statSync(current_path).birthtime.toISOString(),
            });

          const movie = get_item(folder, tmdb_movie.id);
          if (movie && save_images) {
            logger.info('Checking for missing images...');
            if (
              movie.metadata.backdrop_path &&
              !existsSync(join(movie.path, BACKDROP_FILENAME))
            )
              images.push({
                url: `https://image.tmdb.org/t/p/original${movie.metadata.backdrop_path}`,
                path: join(movie.path, BACKDROP_FILENAME),
              });
            if (
              movie.metadata.logo_path &&
              !existsSync(join(movie.path, LOGO_FILENAME))
            )
              images.push({
                url: `https://image.tmdb.org/t/p/original${movie.metadata.logo_path}`,
                path: join(movie.path, LOGO_FILENAME),
              });
            if (
              movie.metadata.poster_path &&
              !existsSync(join(movie.path, POSTER_FILENAME))
            )
              images.push({
                url: `https://image.tmdb.org/t/p/original${movie.metadata.poster_path}`,
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
        );
        logger.error(error);
      }
    }
  }

  await download_images_concurrently(images);
};
