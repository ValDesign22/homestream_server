import express from 'express';
import { Controller, HttpMethod, Route } from "../utils/route.js";
import { search } from '../utils/tmdb.js';

class SearchController extends Controller {
  @Route({
    path: '/search',
    method: HttpMethod.GET,
    query: [{
      type: 'string',
      required: true,
      name: 'query',
    }, {
      type: 'string',
      required: true,
      name: 'type',
      match: /^(movie|tv)$/,
    }],
  })
  public async get(req: express.Request, res: express.Response) {
    const { query, type } = req.query;

    const results = await search(query as string, type as string);
    return this.sendResponse(res, results);
  }
}

export const searchController = new SearchController();