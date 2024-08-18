import { Request, Response } from 'express';
import { getCollectionById } from '../utils/item';

const collectionHandler = (req: Request, res: Response) => {
  const collectionId = req.query.id;

  if (!collectionId) return res.status(400).json({ message: 'Missing required field: id' });

  let collection = getCollectionById(parseInt(collectionId as string, 10));

  res.status(200).json(collection);
}

export { collectionHandler };
