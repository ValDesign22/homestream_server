import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { createReadStream, statSync } from 'node:fs';
import { searchItemById } from '../utils/item';
import { IMovie, ITvShowEpisode } from '../utils/types';
import { load_config } from '../utils/config';
import { getHardwareAccelerationSupport } from '../utils/video';
import ffmpeg from 'fluent-ffmpeg';

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

    const { hardware_acceleration } = load_config()!;
    const hwaccelsSupported = hardware_acceleration && getHardwareAccelerationSupport();

    const videoItem = searchItemById(parseInt(id as string, 10), true) as IMovie | ITvShowEpisode | null;
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

      if (hwaccelsSupported) {
        console.log('[HWACCEL] Using hardware-accelerated video streaming');

        ffmpeg(videoPath)
          .setStartTime(start)
          .videoCodec('h264_nvenc')
          .format('mp4')
          .addOutputOptions([
            '-hwaccel cuvid',
            '-movflags frag_keyframe+empty_moov',
            '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
          ])
          .on('error', (err) => {
            console.log('[HWACCEL] Error:', err);
            res.status(500).end('Error streaming video');
          })
          .on('end', () => {
            console.log('[HWACCEL] Video streaming ended');
            res.end();
          })
          .pipe(res, { end: true });

        req.on('close', () => {
          if (!res.writableEnded) res.end();
        });
      } else {
        console.log('[HWACCEL] Hardware acceleration not enabled or supported');

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
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
