import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoItemById } from '../utils/video';

const tracksHandler = (req: Request, res: Response) => {
  const { id } = req.query;

  if (!id) return res.status(400).send('No id provided');

  const videoItem = getVideoItemById(parseInt(id as string, 10));
  if (!videoItem) return res.status(404).send('Video not found');

  const videoPath = videoItem.path;
  if (!videoPath) return res.status(404).send('Video has no path');

  try {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error extracting video metadata');
      }

      const tracks = metadata.streams.map((stream) => {
        if (stream.index === 0) return null;
        if (!stream.tags) return null;
        return {
          index: stream.index,
          codec_name: stream.codec_name,
          codec_type: stream.codec_type,
          channel_layout: stream.channel_layout,
          language: stream.tags.language,
          handler_name: stream.tags.handler_name,
        };
      });

      const formattedTracks = tracks.filter((track) => track !== null);

      res.status(200).json({
        message: 'Available tracks',
        tracks: formattedTracks
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

export { tracksHandler };
