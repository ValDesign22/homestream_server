import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { getCodecs } from '../utils/video';

@Controller('/test')
export class TestController {
  @Get()
  public async get(req: Request, res: Response) {
    const codecs = await getCodecs();

    return res.status(200).json(codecs);
  }
}