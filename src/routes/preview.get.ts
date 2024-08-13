import { Request, Response } from 'express';
import { searchItemById } from '../utils/video';
import { load_config } from '../utils/config';
import { EMediaType } from '../utils/types';
import { search_video } from '../utils/tmdb';

const previewHandler = async (req: Request, res: Response) => {
  const idQuery = req.query.id;

  if (!idQuery) return res.status(400).send('No video id provided');

  const item = searchItemById(parseInt(idQuery as string, 10));
  if (!item) return res.status(404).send('Video not found');

  const config = load_config();

  const media_type = item.hasOwnProperty('collection_id') ? EMediaType.Movies : EMediaType.TvShows;
  const preview_video_url = await search_video(item.id, media_type, config);
  if (!preview_video_url) return res.status(404).send('Preview video not found');

  res.status(200).send(preview_video_url);
};

export { previewHandler };
