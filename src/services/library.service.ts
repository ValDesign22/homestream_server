import axios from 'axios';
import { createWriteStream, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { get_collection, get_item, load_store, store_collection, store_item } from './store.service';
import { search_collection, search_movie } from './providers/tmdb.service';
import { get_config_path, load_config } from './config.service';
import { BACKDROP_FILENAME, COLLECTIONS_PATH, LIBRARIES_PATH, LOGO_FILENAME, POSTER_FILENAME, VIDEO_EXTENSIONS } from '../utils/constants.util';
import { EImageType, EMediaType } from '../utils/types/enums.util';
import { IConfig, IFolder, IMovie } from '../utils/types/interfaces.util';
import logger from './logger.service';

export const get_library_path = (folder: IFolder): string => {
  const libraries_path = join(get_config_path(), LIBRARIES_PATH, folder.id.toString());
  if (!existsSync(libraries_path)) mkdirSync(libraries_path, { recursive: true });
  return libraries_path;
};

const get_collections_path = (): string => {
  const collections_path = join(get_config_path(), COLLECTIONS_PATH);
  if (!existsSync(collections_path)) mkdirSync(collections_path, { recursive: true });
  return collections_path;
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
    logger.error(`Failed to download image from URL: ${url}`, error);
  }
};

const download_images_concurrently = async (images: { url: string, path: string }[]): Promise<void> => {
  try {
    await Promise.all(images.map(async ({ url, path }) => {
      await download_image(url, path);
    }));
  } catch (error) {
    logger.error('Failed to download images concurrently:', error);
  }
}

export const get_movie_image = (folder: IFolder, id: number, image_type: EImageType): string | null => {
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
}

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
  const images: { url: string, path: string }[] = [];

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

      logger.info(`Analyzing movie: ${full_path}\n${title} (${year || 'Unknown Year'})`);

      try {
        const tmdb_movie = await search_movie(title, year);
        if (tmdb_movie) {
          if (!get_item(folder, tmdb_movie.id)) store_item(folder, {
            ...tmdb_movie,
            path: full_path,
          });

          const movie = get_item(folder, tmdb_movie.id);
          if (movie && save_images) {
            if (tmdb_movie.backdrop_path) images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_movie.backdrop_path}`,
              path: join(movie.path, BACKDROP_FILENAME),
            });
            if (tmdb_movie.logo_path) images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_movie.logo_path}`,
              path: join(movie.path, LOGO_FILENAME),
            });
            if (tmdb_movie.poster_path) images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_movie.poster_path}`,
              path: join(movie.path, POSTER_FILENAME),
            });
          }

          logger.info(`Analyzed movie: ${full_path}\n${tmdb_movie.title} (${tmdb_movie.release_date.split('-')[0]})`);
        }
      } catch (error) {
        logger.error(`Failed to search for movie: ${full_path}\n${title} (${year || 'Unknown Year'})`, error);
      }
    }
  }

  await download_images_concurrently(images);
};

const analyze_collections = async (folder: IFolder, { save_images }: IConfig): Promise<void> => {
  const movies = load_store(folder) as { path: string, metadata: IMovie }[];

  const collections = new Set<number>();
  const images: { url: string, path: string }[] = [];

  for (const movie of movies) {
    if (movies.filter((m) => m.metadata.collection_id === movie.metadata.collection_id).length < 2) continue;

    if (movie.metadata.collection_id && !collections.has(movie.metadata.collection_id)) {
      try {
        let collection = get_collection(movie.metadata.collection_id);
        if (!collection) {
          const tmdb_collection = await search_collection(movie.metadata.collection_id);
          if (tmdb_collection) {
            store_collection(tmdb_collection);
            collection = tmdb_collection;
          }
        }

        if (collection && save_images) {
          if (collection.backdrop_path) images.push({
            url: `https://image.tmdb.org/t/p/original${collection.backdrop_path}`,
            path: join(get_collections_path(), collection.id.toString(), BACKDROP_FILENAME),
          });
          if (collection.poster_path) images.push({
            url: `https://image.tmdb.org/t/p/original${collection.poster_path}`,
            path: join(get_collections_path(), collection.id.toString(), POSTER_FILENAME),
          });
        }

        collections.add(movie.metadata.collection_id);
      } catch (error) {
        console.error(`Failed to search for collection: ${movie.path}`, error);
      }
    }
  }

  await download_images_concurrently(images);
};

const analyze_tvshows = async (folder: IFolder, { save_images }: IConfig): Promise<void> => {
  // TODO: Implement TV Shows analysis
  return;
};

export const analyze_library = async (folder: IFolder, config: IConfig): Promise<void> => {
  switch (folder.media_type) {
    case EMediaType.Movies:
      await analyze_movies(folder, config);
      if (config.create_collections) await analyze_collections(folder, config);
    case EMediaType.TvShows:
      await analyze_tvshows(folder, config);
  }
};
