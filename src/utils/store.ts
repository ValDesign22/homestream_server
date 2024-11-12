import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { IFolder, IMovie, ITvShow } from './types';
import { load_config } from './config';

const load_store = (folder: IFolder): IMovie[] | ITvShow[] => {
  const config = load_config();
  if (!config) return [];
  const { app_storage_path } = config;
  if (!existsSync(app_storage_path)) return [];

  const store_path = `${app_storage_path}/${folder.id}_store.json`;
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
  const config = load_config();
  if (!config) return;

  const store_path = `${config.app_storage_path}/${folder.id}_store.json`;
  writeFileSync(store_path, JSON.stringify(content, null, 2));
}

export { load_store, save_store };
