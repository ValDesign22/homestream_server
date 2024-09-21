import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { IFolder, IMovie, ITvShow } from './types.js';

const load_store = (folder: IFolder): IMovie[] | ITvShow[] => {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return [];
  if (!existsSync(APP_STORAGE_PATH)) return [];

  const store_path = `${APP_STORAGE_PATH}/${folder.id}_store.json`;
  if (!existsSync(store_path)) writeFileSync(store_path, '[]');
  const store = readFileSync(store_path, 'utf-8');

  try {
    return JSON.parse(store);
  } catch (error) {
    console.error(error);
    return [];
  }
}

const save_store = (folder: IFolder, content: IMovie[] | ITvShow[]) => {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return;

  const store_path = `${APP_STORAGE_PATH}/${folder.id}_store.json`;
  writeFileSync(store_path, JSON.stringify(content, null, 2));
}

export { load_store, save_store };
