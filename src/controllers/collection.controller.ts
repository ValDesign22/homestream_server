import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { get_collection } from '../services/library/collection.service';

@Controller('/collection')
export class CollectionController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public get(req: Request, res: Response) {
    const { id } = req.query;
    const collection = get_collection(parseInt(id as string, 10));
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    return res.status(200).json(collection);
  }
}
