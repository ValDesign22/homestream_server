import { Request, Response } from 'express';
import { getVideoItemById, searchItemById } from '../utils/item';
import { IMovie, ITvShow, ITvShowEpisode } from '../utils/types';

const detailsPatchHandler = (req: Request, res: Response) => {
  const idQuery = req.query.id;

  if (!idQuery) return res.status(400).json({ message: 'Missing required field: id' });

  let item: IMovie | ITvShow | ITvShowEpisode | null = searchItemById(parseInt(idQuery as string, 10));
  if (!item) {
    item = getVideoItemById(parseInt(idQuery as string, 10));
    if (!item) return res.status(404).json({ message: 'Video not found' });
  }

  res.status(200).json(item);
};

export { detailsPatchHandler };
