import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { platform, homedir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { IConfig } from './types';

const get_config_path = (): string => {
  const config_name = 'homestream_server';
  switch (platform()) {
    case 'win32':
      return join(homedir(), 'AppData', 'Roaming', config_name);
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support', config_name);
    case 'linux':
      return join(homedir(), '.config', config_name);
    default:
      if (platform().startsWith('win')) return join(homedir(), 'AppData', 'Roaming', config_name);
      return join(homedir(), '.config', config_name);
  }
};

const ensure_config_path = (): void => {
  const config_path = get_config_path();
  if (!existsSync(config_path)) mkdirSync(config_path, { recursive: true });
};

const load_config = (): IConfig | null => {
  const config_path = get_config_path();
  if (!existsSync(config_path)) {
    ensure_config_path();
    return null;
  }

  if (!existsSync(join(config_path, 'config.yml'))) return null;

  const config = readFileSync(join(config_path, 'config.yml'), 'utf-8');
  return parse(config) as IConfig;
}

const save_config = (config: IConfig) => {
  const config_path = get_config_path();
  ensure_config_path();

  writeFileSync(join(config_path, 'config.yml'), stringify(config));
};

export { load_config, save_config };