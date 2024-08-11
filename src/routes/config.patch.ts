import { Request, Response } from 'express';
import { IConfig } from '../utils/types';
import { save_config } from '../utils/config';

const configHandler = async (req: Request, res: Response) => {
  const { folders, tmdb_language } = req.body as Request['body'] & IConfig;
  console.log(folders, tmdb_language)

  if (!folders || !tmdb_language) {
    return res.status(400).send('Missing required fields');
  }

  try {
    save_config({ folders, tmdb_language });
    res.status(200).send('Config updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update config');
  }
};

export { configHandler };
