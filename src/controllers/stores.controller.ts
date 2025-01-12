import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '../services/config.service';
import { load_store } from '../services/store.service';
import { IMovie, ITvShow } from '../utils/types/interfaces.util';

@Controller('/stores')
export class StoresController {
  @Get()
  public get(_: Request, res: Response) {
    const config = load_config()!;
    const stores: Record<
      string,
      { path: string; metadata: IMovie | ITvShow }[]
    > = {};
    for (const folder of config.folders)
      stores[folder.name] = load_store(folder);
    return res.status(200).json(stores);
  }
}
