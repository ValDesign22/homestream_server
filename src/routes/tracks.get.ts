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
        console.log(stream);
        return {
          index: stream.index,
          type: stream.codec_type,
          language: stream.tags?.language || 'unknown'
        };
      });

      const formattedTracks = tracks.map(track => {
        const type = track.type === 'audio' ? 'Audio' : 'Subtitle';
        return `${type} ${track.language}`;
      });

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
