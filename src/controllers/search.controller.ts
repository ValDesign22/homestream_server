import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { search } from '../services/providers';

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
  public async get(req: Request, res: Response) {
    const { query, type } = req.query;
    const results = await search(query as string, type as string);
    return res.status(200).json(results);
  }
}
