import { Controller, Get } from '@nuxum/core';
import express from 'express';
import { load_config } from '../utils/config.js';
import { load_store } from '../utils/store.js';
import { IMovie, ITvShow } from '../utils/types.js';

@Controller('/stores')
export class StoresController {
  @Get()
  public get(_: express.Request, res: express.Response) {
    const config = load_config();

    const stores: Record<string, IMovie[] | ITvShow[]> = {};

    for (const folder of config.folders) stores[folder.name] = load_store(folder);

    return res.status(200).json(stores);
  }
}
