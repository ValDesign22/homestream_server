import { Controller, Get } from '@nuxum/core';
import express from 'express';
import { getCollectionById } from '../utils/item.js';

@Controller('/collection')
export class CollectionController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public get(req: express.Request, res: express.Response) {
    const { id } = req.query;
    return res.status(200).json(getCollectionById(parseInt(id as string, 10)));
  }
}
