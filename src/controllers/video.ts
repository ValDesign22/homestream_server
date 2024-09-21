import express from 'express';
import { createReadStream, statSync } from 'node:fs';
import { getVideoItemById } from '../utils/item.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';

class VideoController extends Controller {
  @Route({
    path: '/video',
    method: HttpMethod.GET,
    query: ['id'],
  })
  public get(req: express.Request, res: express.Response) {
    const { id } = req.query;

    const videoItem = getVideoItemById(parseInt(id as string, 10));
    if (!videoItem) return this.sendError(res, 'Video not found', 404);

    const videoPath = videoItem.path;
    if (!videoPath) return this.sendError(res, 'Video has no path', 404);

    try {
      const stat = statSync(videoPath);

      if (!stat.isFile()) return this.sendError(res, 'Video not found', 404);

      const range = req.headers.range;
      if (!range) return this.sendError(res, 'Range header is required', 400);

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
      this.sendError(res, 'Internal server error', 500);
    }
  }
}

export const videoController = new VideoController();
