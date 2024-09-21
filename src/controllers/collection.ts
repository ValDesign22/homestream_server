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
    return this.sendResponse(res, getCollectionById(parseInt(id as string, 10)));
  }
}

export const collectionController = new CollectionController();