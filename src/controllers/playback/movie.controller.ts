import { Controller, Get } from '@nuxum/core';
import { existsSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { Request, Response } from 'express';
import { get_movie } from '../../services/library/movie.service';
import logger from '../../services/logger.service';
import { HLS_OUTPUT_DIR } from '../../utils/constants.util';
import { create_hls_stream } from '../../services/stream.service';

@Controller('/playback/movie')
export class MoviePlaybackController {
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
    const { id } = req.query;
    const movie_item = get_movie(parseInt(id as string, 10));
    if (!movie_item)
      return res.status(404).json({ message: 'Movie not found' });

    const video_path = movie_item.path;
    if (!video_path || !existsSync(video_path))
      return res.status(404).json({ message: 'Video file not found' });

    const hls_output_dir = join(process.cwd(), HLS_OUTPUT_DIR, `movie_${id}`);
    const playlist_path = join(hls_output_dir, 'index.m3u8');

    if (!existsSync(playlist_path)) {
      try {
        await create_hls_stream(video_path, hls_output_dir);
      } catch (error) {
        logger.error('Error creating HLS stream:', error);
        return res
          .status(500)
          .json({ message: 'Failed to generate HLS playlist' });
      }
    }

    res.on('close', () => {
      logger.info(`Cleaning up HLS files for movie ${id}`);
      rmdirSync(hls_output_dir, { recursive: true });
    });

    res.sendFile(playlist_path);
  }
}
