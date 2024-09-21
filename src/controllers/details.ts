import express from 'express';
import { Controller, HttpMethod, Route } from '../utils/route.js';
import { IMovie, ITvShow, ITvShowEpisode } from '../utils/types.js';
import { getVideoItemById, searchItemById } from '../utils/item.js';

class DetailsController extends Controller {
  @Route({
    path: '/details',
    method: HttpMethod.GET,
    query: ['id'],
  })
  public get(req: express.Request, res: express.Response) {
    const { id } = req.query;
    let item: IMovie | ITvShow | ITvShowEpisode | null = searchItemById(parseInt(id as string, 10));
    if (!item) {
      item = getVideoItemById(parseInt(id as string, 10));
      if (!item) return this.sendError(res, 'Video not found', 404);
    }
    return this.sendResponse(res, item);
  }

  @Route({
    path: '/details',
    method: HttpMethod.PATCH,
    query: ['id'],
  })
  public patch(req: express.Request, res: express.Response) {
    const { id } = req.query;
    let item: IMovie | ITvShow | ITvShowEpisode | null = searchItemById(parseInt(id as string, 10));
    if (!item) {
      item = getVideoItemById(parseInt(id as string, 10));
      if (!item) return this.sendError(res, 'Video not found', 404);
    }
    return this.sendResponse(res, item);
  }
}

export const detailsController = new DetailsController();
