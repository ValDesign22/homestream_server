import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { ffprobe } from 'fluent-ffmpeg';
import { searchItemById } from '../utils/item';
import { IMovie, ITrack, ITracks, ITvShowEpisode } from '../utils/types';
import { extractSubtitles } from '../utils/subtitles';

@Controller('/tracks')
export class TracksController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public get(req: Request, res: Response) {
    const { id } = req.query;

    const videoItem = searchItemById(parseInt(id as string, 10), true) as IMovie | ITvShowEpisode | null;
    if (!videoItem) return res.status(404).json({ message: 'Video not found' });

    const videoPath = videoItem.path;
    if (!videoPath) return res.status(404).json({ message: 'Video has no path' });

    try {
      ffprobe(videoPath, (error, metadata) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error extracting video metadata' });
        }

        const tracks: ITracks = {
          audios: [],
          subtitles: [],
        };

        extractSubtitles(videoItem);

        metadata.streams.map((stream) => {
          const data: ITrack = {
            index: tracks.audios.length,
            codec_name: stream.codec_name,
            codec_type: stream.codec_type,
            channel_layout: stream.channel_layout,
            language: stream.tags.language,
            handler_name: stream.tags.handler_name,
            default: stream.disposition?.default === 1,
          };
          if (stream.codec_type === 'audio') tracks.audios.push({
            ...data,
            url: `/track?id=${id}&extract_type=${stream.codec_type}&track_index=${tracks.audios.length}`,
          });
          if (stream.codec_type === 'subtitle') tracks.subtitles.push({
            ...data,
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
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
