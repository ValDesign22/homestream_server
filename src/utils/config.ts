import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IConfig } from './types';

const load_config = (): IConfig => {
  if (!existsSync('config.json')) {
    writeFileSync('config.json', JSON.stringify({ folders: [], tmdb_language: 'en-US' }, null, 2));
  }
  const config_path = readFileSync('config.json', 'utf-8');
  return JSON.parse(config_path);
};

const save_config = (config: IConfig) => {
  writeFileSync('config.json', JSON.stringify(config, null, 2));
};

export { load_config, save_config };