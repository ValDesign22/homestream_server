import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '../utils/config';
import { tmdb_request } from '../services/tmdb.service';

@Controller('/test')
export class TestController {
  @Get()
  public async get(req: Request, res: Response) {
    const config = load_config();

    if (!config) return res.status(500).json('Config not found');

    const tmdb_req = await tmdb_request('/authentication');
    console.log('TMDB request:', tmdb_req);

    return res.status(200).json({ message: 'Test completed successfully' });
  }
}