import { Request, Response } from 'express';
import { searchItemById } from '../utils/video';

const detailsHandler = (req: Request, res: Response) => {
  const idQuery = req.query.id;

  if (!idQuery) return res.status(400).send('No video path provided');

  const item = searchItemById(parseInt(idQuery as string, 10));
  if (!item) return res.status(404).send('Video not found');

  res.status(200).send(item);
};

export { detailsHandler };
