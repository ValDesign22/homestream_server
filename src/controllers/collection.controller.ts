import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { getCollectionById } from '../utils/item';

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
    return res.status(200).json(getCollectionById(parseInt(id as string, 10)));
  }
}
