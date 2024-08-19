import { Request, Response } from 'express';
import { getProfiles, saveProfiles } from '../utils/profiles';

const profilesDelete = (req: Request, res: Response) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ message: 'Missing required field: id' });
  if (isNaN(parseInt(id))) return res.status(400).json({ message: 'Invalid id' });

  const profiles = getProfiles();
  if (!profiles) return res.status(404).json({ message: 'Profiles not found' });

  saveProfiles(profiles.filter((profile) => profile.id !== parseInt(id)));

  res.status(200).json({ message: 'Profile deleted' });
};

export { profilesDelete };
