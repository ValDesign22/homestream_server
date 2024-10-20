import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '../utils/config';
import { load_store } from '../utils/store';
import { IMovie, ITvShow } from '../utils/types';

@Controller('/stores')
export class StoresController {
  @Get()
  public get(_: Request, res: Response) {
    const config = load_config();

    const stores: Record<string, IMovie[] | ITvShow[]> = {};

    for (const folder of config.folders) stores[folder.name] = load_store(folder);

    return res.status(200).json(stores);
  }
}
