import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoItemById } from '../utils/item';
import { ITracks } from '../utils/types';

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

      const tracks: ITracks = {
        audios: [],
        subtitles: [],
      };

      metadata.streams.map((stream) => {
        if (stream.codec_type === 'audio') tracks.audios.push({
          index: stream.index,
          codec_name: stream.codec_name,
          codec_type: stream.codec_type,
          channel_layout: stream.channel_layout,
          language: stream.tags.language,
          handler_name: stream.tags.handler_name,
          url: `/track?id=${id}&extract_type=${stream.codec_type}&track_index=${tracks.audios.length}`,
        });
        if (stream.codec_type === 'subtitle') tracks.subtitles.push({
          index: stream.index,
          codec_name: stream.codec_name,
          codec_type: stream.codec_type,
          channel_layout: stream.channel_layout,
          language: stream.tags.language,
          handler_name: stream.tags.handler_name,
          url: `/track?id=${id}&extract_type=${stream.codec_type}&track_index=${tracks.subtitles.length}`,
        });
      });

      res.status(200).json({
        message: 'Available tracks',
        tracks,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export { tracksHandler };
