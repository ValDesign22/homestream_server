import { load_config } from '#/services/config.service';
import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';

@Controller('/libraries')
export class LibrariesController {
  @Get()
  public async get(req: Request, res: Response) {
    const config = load_config()!;
    return res.status(200).json(config.folders);
  }
}
