import express from 'express';
import { load_config } from '../utils/config.js';
import { searchItemById } from '../utils/item.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';
import { EMediaType } from '../utils/types.js';
import { search_video } from '../utils/tmdb.js';

class PreviewController extends Controller {
  @Route({
    path: '/preview',
    method: HttpMethod.GET,
    query: ['id'],
  })
  public async get(req: express.Request, res: express.Response) {
    const { id } = req.query;
    const item = searchItemById(parseInt(id as string, 10));
    if (!item) return this.sendError(res, 'Video not found', 404);

    const config = load_config();

    const media_type = item.hasOwnProperty('collection_id') ? EMediaType.Movies : EMediaType.TvShows;
    const preview_video_url = await search_video(item.id, media_type, config);
    if (!preview_video_url) return this.sendError(res, 'Preview video not found', 404);

    return this.sendResponse(res, preview_video_url);
  }
}

export const previewController = new PreviewController();
