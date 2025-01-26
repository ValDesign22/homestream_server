import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';

@Controller('/connect')
export class ConnectController {
  @Get()
  public async get(req: Request, res: Response) {
    return res.status(200).json({ message: 'Connected' });
  }
}
