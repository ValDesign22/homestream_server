import { Request, Response } from 'express';
import { getProfiles, saveProfiles } from '../utils/profiles';

const profilesPatch = (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Missing required field: id' });
  if (isNaN(parseInt(id))) return res.status(400).json({ message: 'Invalid id' });

  const profiles = getProfiles();
  if (!profiles) return res.status(404).json({ message: 'Profiles not found' });
  if (!profiles.find((profile) => profile.id === parseInt(id))) return res.status(404).json({ message: 'Profile not found' });

  const updatedProfile = req.body;
  if (!updatedProfile) return res.status(400).json({ message: 'Missing required field: updatedProfile' });

  saveProfiles(profiles.map((profile) => (profile.id === parseInt(id) ? updatedProfile : profile)));

  res.status(200).json({ message: 'Profile updated' });
};

export { profilesPatch };
