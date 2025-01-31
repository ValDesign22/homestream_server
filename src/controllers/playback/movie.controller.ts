import { Controller, Get } from '@nuxum/core';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Request, Response } from 'express';
import { get_movie } from '#/services/library/movie.service';
import logger from '#/services/logger.service';
import { HLS_OUTPUT_DIR } from '#/utils/constants.util';
import { create_hls_stream } from '#/services/stream.service';

@Controller('/playback/movie')
export class MoviePlaybackController {
  @Get('/:id')
  public async get(req: Request, res: Response) {
    const { id } = req.params;
    const movie_item = get_movie(parseInt(id as string, 10));
    if (!movie_item)
      return res.status(404).json({ message: 'Movie not found' });

    const video_path = movie_item.metadata.path;
    if (!video_path || !existsSync(video_path))
      return res.status(404).json({ message: 'Video file not found' });

    const hls_output_dir = join(process.cwd(), HLS_OUTPUT_DIR, `movie_${id}`);
    if (!existsSync(hls_output_dir)) {
      mkdirSync(hls_output_dir, { recursive: true });

      try {
        logger.info('Creating HLS stream for movie:', id);
        create_hls_stream(video_path, hls_output_dir);
        logger.info('HLS stream created successfully');
      } catch (error) {
        logger.error('Error creating HLS stream:', error);
        return res
          .status(500)
          .json({ message: 'Failed to generate HLS playlist' });
      }
    }

    logger.info('Redirecting to HLS stream:', id);
    res.redirect(`/playback/movie/hls/${id}/playlist.m3u8`);
  }

  @Get('/hls/:id/:file')
  public async get_hls(req: Request, res: Response) {
    const { id, file } = req.params;
    const hls_output_dir = join(process.cwd(), HLS_OUTPUT_DIR, `movie_${id}`);
    const file_path = join(hls_output_dir, file);

    if (!existsSync(file_path))
      return res.status(404).json({ message: 'HLS file not found' });

    return res.sendFile(file_path);
  }
}
