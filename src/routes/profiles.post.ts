import { Request, Response } from 'express';
import { IProfile } from '../utils/types';
import { getProfiles, saveProfiles } from '../utils/profiles';

const profilesPost = (req: Request, res: Response) => {
  const newProfile = req.body as IProfile;
  const profiles = getProfiles();
  if (!profiles) return res.status(500).json({ message: 'Internal Server Error' });
  profiles.push(newProfile);
  saveProfiles(profiles);
  res.status(201).json({ message: 'Profile created' });
};

export { profilesPost };
