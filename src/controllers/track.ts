import express from 'express';
import chalk from 'chalk';
import { getVideoItemById } from '../utils/item.js';
import ffmpeg from 'fluent-ffmpeg';
import { extractSubtitle, getSubtitlePath, subtitleExists } from '../utils/subtitles.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';

class TrackController extends Controller {
  @Route({
    path: '/track',
    method: HttpMethod.GET,
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
  public get(req: express.Request, res: express.Response) {
    const { id, extract_type, track_index } = req.query;
    if (!['audio', 'subtitle'].includes(extract_type as string)) return this.sendError(res, 'Invalid extract_type', 400);

    const videoItem = getVideoItemById(parseInt(id as string, 10));
    if (!videoItem) return this.sendError(res, 'Video not found', 404);

    const videoPath = videoItem.path;
    if (!videoPath) return this.sendError(res, 'Video has no path', 404);

    try {
      ffmpeg.ffprobe(videoPath, async (error, metadata) => {
        if (error) {
          console.error(error);
          return this.sendError(res, 'Error extracting video metadata', 500);
        }

        const streams = metadata.streams.filter((stream) => stream.codec_type === extract_type);
        if (!streams || streams.length === 0) return this.sendError(res, 'No extract data found', 404);

        const streamIndex = parseInt(track_index as string, 10);
        if (isNaN(streamIndex) || streamIndex < 0) return this.sendError(res, 'Invalid track_index', 400);

        const stream = streams[streamIndex];
        if (!stream || !stream.codec_name) return this.sendError(res, 'Track not found', 404);

        if (extract_type === 'audio') {
          ffmpeg(videoPath)
            .noVideo()
            .outputFormat('mp3')
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .outputOptions([`-map 0:a:${streamIndex}?`])
            .on('error', (error) => {
              console.error(error);
              if (!res.headersSent) this.sendError(res, 'Error extracting audio', 500);
            })
            .pipe(res.writeHead(200, { 'Content-Type': 'audio/mpeg' }), { end: true });
        } else if (extract_type === 'subtitle') {
          if (stream.codec_name && !subtitleExists(videoItem, streamIndex, stream.codec_name))
            extractSubtitle(videoItem, streamIndex, stream.codec_name)
              .then((destination) => console.log(`[${chalk.green('TRACKS')}] Extracted subtitle ${streamIndex} for ${videoItem.id} at ${destination}`))
              .catch((error) => console.error(error));
          const subtitlesPath = getSubtitlePath(videoItem, streamIndex, stream.codec_name);
          if (!subtitlesPath) return this.sendError(res, 'Cannot find any subtitles for this video', 404);
          res.sendFile(subtitlesPath);
        }
      });
    } catch (error) {
      console.error(error);
      this.sendError(res, 'Internal server error', 500);
    }
  }
}

export const trackController = new TrackController();
