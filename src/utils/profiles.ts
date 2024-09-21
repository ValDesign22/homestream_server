import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { IProfile } from './types.js';

const getProfiles = (): IProfile[] | null => {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) throw new Error('APP_STORAGE_PATH is not defined');
  if (!existsSync(APP_STORAGE_PATH)) return null;

  const profiles_path = `${APP_STORAGE_PATH}/profiles.json`;
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
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return;

  const profiles_path = `${APP_STORAGE_PATH}/profiles.json`;
  writeFileSync(profiles_path, JSON.stringify(profiles, null, 2));
}

export { getProfiles, saveProfiles };
