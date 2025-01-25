import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { get_config_path } from '#/services/config.service';
import { load_store } from '#/services/store.service';
import logger from '#/services/logger.service';
import { search_collection } from '#/services/providers/tmdb/collection.service';
import {
  BACKDROP_FILENAME,
  COLLECTIONS_PATH,
  METADATA_FILENAME,
  POSTER_FILENAME,
} from '#/utils/constants.util';
import { IConfig, IFolder, IMovie } from '#/utils/types/interfaces.util';
import { download_images_concurrently } from '#/services/library/index';
import { ITmdbMovieCollection } from '#/utils/types/tmdb.types';

const get_collections_path = (): string => {
  const collections_path = join(get_config_path(), COLLECTIONS_PATH);
  if (!existsSync(collections_path))
    mkdirSync(collections_path, { recursive: true });
  return collections_path;
};

export const get_collection = (id: number): ITmdbMovieCollection | null => {
  try {
    const collections_path = join(get_config_path(), COLLECTIONS_PATH);
    if (!existsSync(collections_path))
      mkdirSync(collections_path, { recursive: true });
    const collection_path = join(collections_path, id.toString());
    if (!existsSync(collection_path))
      mkdirSync(collection_path, { recursive: true });
    const metadata_path = join(collection_path, METADATA_FILENAME);

    if (!existsSync(metadata_path)) return null;

    const metadataContent = readFileSync(metadata_path, 'utf-8');
    const metadata = parse(metadataContent);

    return metadata as ITmdbMovieCollection;
  } catch (err) {
    logger.error(`Failed to get collection with ID ${id}:`, err);
    return null;
  }
};

export const store_collection = (collection: ITmdbMovieCollection): void => {
  try {
    const collections_path = join(get_config_path(), 'collections');
    if (!existsSync(collections_path))
      mkdirSync(collections_path, { recursive: true });
    const metadata_path = join(
      collections_path,
      collection.id.toString(),
      METADATA_FILENAME,
    );
    const metadataContent = stringify(collection);

    writeFileSync(metadata_path, metadataContent);
  } catch (err) {
    logger.error(`Failed to store collection with ID ${collection.id}:`, err);
  }
};

export const analyze_collections = async (
  folder: IFolder,
  { save_images }: IConfig,
): Promise<void> => {
  const movies = load_store(folder) as { path: string; metadata: IMovie }[];

  const collections = new Set<number>();
  const images: { url: string; path: string }[] = [];

  for (const movie of movies) {
    if (
      movie.metadata.metadata.belongs_to_collection &&
      movies.filter(
        (m) =>
          m.metadata.metadata.belongs_to_collection?.id ===
          movie.metadata.metadata.belongs_to_collection?.id,
      ).length < 2
    )
      continue;

    if (
      movie.metadata.metadata.belongs_to_collection &&
      !collections.has(movie.metadata.metadata.belongs_to_collection.id)
    ) {
      try {
        let collection = get_collection(
          movie.metadata.metadata.belongs_to_collection.id,
        );
        if (!collection) {
          const tmdb_collection = await search_collection(
            movie.metadata.metadata.belongs_to_collection.id,
          );
          if (tmdb_collection) {
            store_collection(tmdb_collection);
            collection = tmdb_collection;
          }
        }

        if (collection && save_images) {
          if (collection.backdrop_path)
            images.push({
              url: `https://image.tmdb.org/t/p/original${collection.backdrop_path}`,
              path: join(
                get_collections_path(),
                collection.id.toString(),
                BACKDROP_FILENAME,
              ),
            });
          if (collection.poster_path)
            images.push({
              url: `https://image.tmdb.org/t/p/original${collection.poster_path}`,
              path: join(
                get_collections_path(),
                collection.id.toString(),
                POSTER_FILENAME,
              ),
            });
        }

        collections.add(movie.metadata.metadata.belongs_to_collection.id);
      } catch (error) {
        console.error(`Failed to search for collection: ${movie.path}`, error);
      }
    }
  }

  await download_images_concurrently(images);
};
