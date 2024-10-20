import { Controller, Get } from '@nuxum/core';
import express from 'express';
import { search } from '../utils/tmdb.js';

@Controller('/search')
export class SearchController {
  @Get({
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
    return res.status(200).json(results);
  }
}
