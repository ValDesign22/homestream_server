import express from 'express';
import { load_config } from '../utils/config.js';
import { load_store } from '../utils/store.js';
import { IMovie, ITvShow } from '../utils/types.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';

class StoresController extends Controller {
  @Route({
    path: '/stores',
    method: HttpMethod.GET,
  })
  public get(_: express.Request, res: express.Response) {
    const config = load_config();

    const stores: Record<string, IMovie[] | ITvShow[]> = {};

    for (const folder of config.folders) stores[folder.name] = load_store(folder);

    return this.sendResponse(res, stores);
  }
}

export const storesController = new StoresController();
