import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import chalk from 'chalk';
import { searchItemById } from '../utils/item';
import ffmpeg from 'fluent-ffmpeg';
import { extractSubtitle, getSubtitlePath, subtitleExists } from '../utils/subtitles';
import { IMovie, ITvShowEpisode } from '../utils/types';

@Controller('/track')
export class TrackController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }, {
      type: 'string',
      required: true,
      name: 'extract_type',
      match: /^(audio|subtitle)$/,
    }, {
      type: 'number',
      required: true,
      name: 'track_index',
    }],
  })
  public get(req: Request, res: Response) {
    const { id, extract_type, track_index } = req.query;
    if (!['audio', 'subtitle'].includes(extract_type as string)) return res.status(400).json({ message: 'Invalid extract_type' });

    const videoItem = searchItemById(parseInt(id as string, 10), true) as IMovie | ITvShowEpisode | null;
    if (!videoItem) return res.status(404).json({ message: 'Video not found' });

    const videoPath = videoItem.path;
    if (!videoPath) return res.status(404).json({ message: 'Video has no path' });

    try {
      ffmpeg.ffprobe(videoPath, async (error, metadata) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error extracting video metadata' });
        }

        const streams = metadata.streams.filter((stream) => stream.codec_type === extract_type);
        if (!streams || streams.length === 0) return res.status(404).json({ message: 'No extract data found' });

        const streamIndex = parseInt(track_index as string, 10);
        if (isNaN(streamIndex) || streamIndex < 0) return res.status(400).json({ message: 'Invalid track_index' });

        const stream = streams[streamIndex];
        if (!stream || !stream.codec_name) return res.status(404).json({ message: 'Track not found' });

        if (extract_type === 'audio') {
          ffmpeg(videoPath)
            .noVideo()
            .outputFormat('mp3')
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .outputOptions([`-map 0:a:${streamIndex}?`])
            .on('error', (error) => {
              console.error(error);
              if (!res.headersSent) res.status(500).json({ message: 'Error extracting audio' });
            })
            .pipe(res.writeHead(200, { 'Content-Type': 'audio/mpeg' }), { end: true });
        } else if (extract_type === 'subtitle') {
          if (stream.codec_name && !subtitleExists(videoItem, streamIndex, stream.codec_name))
            extractSubtitle(videoItem, streamIndex, stream.codec_name)
              .then((destination) => console.log(`[${chalk.green('TRACKS')}] Extracted subtitle ${streamIndex} for ${videoItem.id} at ${destination}`))
              .catch((error) => console.error(error));
          const subtitlesPath = getSubtitlePath(videoItem, streamIndex, stream.codec_name);
          if (!subtitlesPath) return res.status(404).json({ message: 'Cannot find any subtitles for this video' });
          res.sendFile(subtitlesPath);
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
