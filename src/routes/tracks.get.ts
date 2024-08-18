import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoItemById } from '../utils/item';

const tracksHandler = (req: Request, res: Response) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'Missing required field: id' });

  const videoItem = getVideoItemById(parseInt(id as string, 10));
  if (!videoItem) return res.status(404).json({ message: 'Video not found' });

  const videoPath = videoItem.path;
  if (!videoPath) return res.status(404).json({ message: 'Video has no path' });

  try {
    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error extracting video metadata', error });
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
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export { tracksHandler };
