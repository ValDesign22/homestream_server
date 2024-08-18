import { Request, Response } from 'express';
import { IConfig } from '../utils/types';
import { save_config } from '../utils/config';

const configPatchHandler = (req: Request, res: Response) => {
  const { folders, tmdb_language } = req.body as Request['body'] & IConfig;

  if (!folders || !tmdb_language) {
    const missingFields = ['folders', 'tmdb_language'].filter(field => !req.body[field]);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    save_config({ folders, tmdb_language });
    res.status(200).json({ message: 'Config updated successfully'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update config', error });
  }
};

export { configPatchHandler };
