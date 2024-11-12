import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { IProfile } from './types';
import { load_config } from './config';

const getProfiles = (): IProfile[] | null => {
  const config = load_config();
  if (!config) return null;
  const { app_storage_path } = config;
  if (!existsSync(app_storage_path)) return null;

  const profiles_path = `${app_storage_path}/profiles.json`;
  if (!existsSync(profiles_path)) writeFileSync(profiles_path, '[]');
  const profiles = readFileSync(profiles_path, 'utf-8');

  try {
    return JSON.parse(profiles);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const saveProfiles = (profiles: IProfile[]) => {
  const config = load_config();
  if (!config) return;

  const profiles_path = `${config.app_storage_path}/profiles.json`;
  writeFileSync(profiles_path, JSON.stringify(profiles, null, 2));
}

export { getProfiles, saveProfiles };
