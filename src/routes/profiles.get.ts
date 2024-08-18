import { Request, Response } from 'express';
import { getProfiles } from '../utils/profiles';

const profilesGet = (req: Request, res: Response) => {
  const profiles = getProfiles();
  res.status(200).json(profiles || []);
};

export { profilesGet };
