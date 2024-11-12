import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '../utils/config';
import { EMediaType } from '../utils/types';
import { explore_tv_shows } from '../utils/explore';

@Controller('/test')
export class TestController {
  @Get()
  public async get(req: Request, res: Response) {
    const config = load_config()!;

    const data = [];

    for (const folder of config.folders) {
      console.log(`Exploring ${folder.name} folder...`);
      if (folder.media_type !== EMediaType.TvShows) continue;
      const tvshows = await explore_tv_shows(config, folder);
      data.push(tvshows);
      console.log(`Found ${folder.name} folder`);
    }

    return res.status(200).json(data);
  }
}