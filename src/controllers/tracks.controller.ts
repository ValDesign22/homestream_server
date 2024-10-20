import { Controller, Get } from '@nuxum/core';
import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoItemById } from '../utils/item.js';
import { ITrack, ITracks } from '../utils/types.js';
import { extractSubtitles } from '../utils/subtitles.js';

@Controller('/tracks')
export class TracksController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public get(req: express.Request, res: express.Response) {
    const { id } = req.query;

    const videoItem = getVideoItemById(parseInt(id as string, 10));
    if (!videoItem) return res.status(404).json({ message: 'Video not found' });

    const videoPath = videoItem.path;
    if (!videoPath) return res.status(404).json({ message: 'Video has no path' });

    try {
      ffmpeg.ffprobe(videoPath, (error, metadata) => {
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
