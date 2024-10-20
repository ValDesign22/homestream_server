import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { createReadStream, statSync } from 'node:fs';
import { getVideoItemById } from '../utils/item';

@Controller('/video')
export class VideoController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public get(req: Request, res: Response) {
    const { id } = req.query;

    const videoItem = getVideoItemById(parseInt(id as string, 10));
    if (!videoItem) return res.status(404).json({ message: 'Video not found' });

    const videoPath = videoItem.path;
    if (!videoPath) return res.status(404).json({ message: 'Video has no path' });

    try {
      const stat = statSync(videoPath);

      if (!stat.isFile()) return res.status(404).json({ message: 'Video not found' });

      const range = req.headers.range;
      if (!range) return res.status(400).json({ message: 'Range header is required' });

      const positions = range.replace(/bytes=/, '').split('-');
      const start = parseInt(positions[0], 10);
      const fileSize = stat.size;
      const end = positions[1] ? parseInt(positions[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });

      const stream = createReadStream(videoPath, { start, end });

      stream.on('open', () => stream.pipe(res));
      stream.on('error', (streamErr) => {
        console.error(streamErr);
        res.status(500).end('Error streaming video');
      });

      req.on('close', () => {
        if (res.writableEnded) return;
        stream.destroy();
        res.end();
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
