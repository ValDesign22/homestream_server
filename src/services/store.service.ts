import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { get_library_path } from './library/index';
import { METADATA_FILENAME } from '../utils/constants.util';
import { EMediaType } from '../utils/types/enums.util';
import { IFolder, IMovie, ITvShow } from '../utils/types/interfaces.util';
import logger from './logger.service';

export const get_item = (
  folder: IFolder,
  id: number,
): { path: string; metadata: IMovie | ITvShow } | null => {
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

export const load_store = (
  folder: IFolder,
): { path: string; metadata: IMovie | ITvShow }[] => {
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
