import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { get_library_path } from './library.service';
import { COLLECTIONS_PATH, METADATA_FILENAME } from '../utils/constants.util';
import { EMediaType } from '../utils/types/enums.util';
import { IFolder, IMovie, IMovieCollection, ITvShow } from '../utils/types/interfaces.util';
import { get_config_path } from './config.service';
import logger from './logger.service';

export const get_item = (folder: IFolder, id: number): { path: string, metadata: IMovie | ITvShow } | null => {
  try {
    const item_path = join(get_library_path(folder), id.toString());
    const metadata_path = join(item_path, METADATA_FILENAME);

    if (!existsSync(metadata_path)) return null;

    const metadataContent = readFileSync(metadata_path, 'utf-8');
    const metadata = parse(metadataContent);

    switch (folder.media_type) {
      case EMediaType.Movies:
        return {
          path: item_path,
          metadata: metadata as IMovie,
        };
      case EMediaType.TvShows:
        return {
          path: item_path,
          metadata: metadata as ITvShow,
        };
      default:
        return null;
    }
  } catch (err) {
    logger.error(`Failed to get item with ID ${id}:`, err);
    return null;
  }
};

export const get_collection = (id: number): IMovieCollection | null => {
  try {
    const collections_path = join(get_config_path(), COLLECTIONS_PATH);
    if (!existsSync(collections_path)) mkdirSync(collections_path, { recursive: true });
    const collection_path = join(collections_path, id.toString());
    if (!existsSync(collection_path)) mkdirSync(collection_path, { recursive: true });
    const metadata_path = join(collection_path, METADATA_FILENAME);

    if (!existsSync(metadata_path)) return null;

    const metadataContent = readFileSync(metadata_path, 'utf-8');
    const metadata = parse(metadataContent);

    return metadata as IMovieCollection;
  } catch (err) {
    logger.error(`Failed to get collection with ID ${id}:`, err);
    return null;
  }
};

export const store_item = (folder: IFolder, item: IMovie | ITvShow): void => {
  try {
    const item_path = join(get_library_path(folder), item.id.toString());

    if (!existsSync(item_path)) mkdirSync(item_path, { recursive: true });

    const metadata_path = join(item_path, METADATA_FILENAME);
    const metadataContent = stringify(item);

    writeFileSync(metadata_path, metadataContent);
  } catch (err) {
    logger.error(`Failed to store item with ID ${item.id}:`, err);
  }
};

export const store_collection = (collection: IMovieCollection): void => {
  try {
    const collections_path = join(get_config_path(), 'collections');
    if (!existsSync(collections_path)) mkdirSync(collections_path, { recursive: true });
    const metadata_path = join(collections_path, collection.id.toString(), METADATA_FILENAME);
    const metadataContent = stringify(collection);

    writeFileSync(metadata_path, metadataContent);
  } catch (err) {
    logger.error(`Failed to store collection with ID ${collection.id}:`, err);
  }
};

export const load_store = (folder: IFolder): { path: string, metadata: IMovie | ITvShow }[] => {
  const store = [];
  try {
    for (const id of readdirSync(get_library_path(folder))) {
      const item = get_item(folder, parseInt(id));
      if (item) store.push({ path: item.path, metadata: item.metadata });
    }
  } catch (err) {
    logger.error(`Failed to load store for folder with ID ${folder.id}:`, err);
  }
  return store;
};
