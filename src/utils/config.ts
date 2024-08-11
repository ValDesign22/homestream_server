import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IConfig } from './types';

const load_config = (): IConfig => {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) throw new Error('APP_STORAGE_PATH not set');

  const config_path = `${APP_STORAGE_PATH}/config.json`;

  if (!existsSync(config_path)) {
    writeFileSync(config_path, JSON.stringify({ folders: [], tmdb_language: 'en-US' }, null, 2));
  }
  const config = readFileSync(config_path, 'utf-8');
  return JSON.parse(config);
};

const save_config = (config: IConfig) => {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) throw new Error('APP_STORAGE_PATH not set');

  const config_path = `${APP_STORAGE_PATH}/config.json`;
  writeFileSync(config_path, JSON.stringify(config, null, 2));
};

export { load_config, save_config };