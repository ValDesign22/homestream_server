import { Request, Response } from 'express';
import { getVideoItemById } from '../utils/video';

const detailsHandler = (req: Request, res: Response) => {
  const idQuery = req.query.id;

  if (!idQuery) return res.status(400).send('No video path provided');

  const videoItem = getVideoItemById(parseInt(idQuery as string, 10));
  if (!videoItem) return res.status(404).send('Video not found');

  res.status(200).send(videoItem);
};

export { detailsHandler };
