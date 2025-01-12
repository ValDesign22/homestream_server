import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { CONFIG_FILENAME, LIBRARIES_PATH } from '#/utils/constants.util';
import { IConfig } from '#/utils/types/interfaces.util';

export const get_config_path = (): string => {
  const config_name = 'homestream_server';
  switch (platform()) {
    case 'win32':
      return join(homedir(), 'AppData', 'Roaming', config_name);
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support', config_name);
    case 'linux':
      return join(homedir(), '.config', config_name);
    default:
      if (platform().startsWith('win'))
        return join(homedir(), 'AppData', 'Roaming', config_name);
      return join(homedir(), '.config', config_name);
  }
};

export const ensure_app_folders = (): void => {
  const config_path = get_config_path();
  const libraries_path = join(config_path, LIBRARIES_PATH);
  if (!existsSync(config_path)) mkdirSync(config_path, { recursive: true });
  if (!existsSync(libraries_path))
    mkdirSync(libraries_path, { recursive: true });
};

export const load_config = (): IConfig | null => {
  const config_path = get_config_path();
  if (!existsSync(config_path)) {
    ensure_app_folders();
    return null;
  }

  if (!existsSync(join(config_path, CONFIG_FILENAME))) return null;

  const config = readFileSync(join(config_path, CONFIG_FILENAME), 'utf-8');
  return parse(config) as IConfig;
};

export const save_config = (config: IConfig) => {
  const config_path = get_config_path();
  ensure_app_folders();

  writeFileSync(join(config_path, CONFIG_FILENAME), stringify(config));
};
