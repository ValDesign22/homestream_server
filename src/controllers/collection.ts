import express from 'express';
import { getCollectionById } from '../utils/item.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';

class CollectionController extends Controller {
  @Route({
    path: '/collection',
    method: HttpMethod.GET,
    query: ['id'],
  })
  public get(req: express.Request, res: express.Response) {
    const { id } = req.query;
    let collection = getCollectionById(parseInt(id as string, 10));
    return this.sendResponse(res, collection);
  }
}

export const collectionController = new CollectionController();