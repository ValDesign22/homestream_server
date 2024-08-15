import { Request, Response } from 'express';
import { IConfig } from '../utils/types';
import { load_config, save_config } from '../utils/config';

const configGetHandler = (req: Request, res: Response) => {
  const config = load_config();
  res.status(200).send(config);
};

const configPatchHandler = (req: Request, res: Response) => {
  const { folders, tmdb_language } = req.body as Request['body'] & IConfig;

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

export { configGetHandler, configPatchHandler };
