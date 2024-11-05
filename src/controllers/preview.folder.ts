import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '../utils/config';
import { searchItemById } from '../utils/item';
import { EMediaType } from '../utils/types';
import { search_video } from '../utils/tmdb';

@Controller('/preview')
export class PreviewController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public async get(req: Request, res: Response) {
    const { id } = req.query;
    const item = searchItemById(parseInt(id as string, 10));
    if (!item) return res.status(404).json({ message: 'Video not found' });

    const config = load_config();

    const media_type = item.hasOwnProperty('collection_id') ? EMediaType.Movies : EMediaType.TvShows;
    const preview_video_url = await search_video(item.id, media_type, config.tmdb_language);
    if (!preview_video_url) return res.status(404).json({ message: 'Preview video not found' });

    return res.status(200).json(preview_video_url);
  }
}
