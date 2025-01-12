import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';

@Controller('/playback/music')
export class MusicPlaybackController {
  @Get({
    query: [
      {
        type: 'number',
        required: true,
        name: 'id',
      },
    ],
  })
  public async get(req: Request, res: Response) {
    return res.status(501).json({ message: 'Not implemented' });
  }
}
