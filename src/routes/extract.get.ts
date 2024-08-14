import { Request, Response } from 'express';
import { getVideoItemById } from '../utils/item';
import ffmpeg from 'fluent-ffmpeg';

const extractHandler = async (req: Request, res: Response) => {
  const { id, extract_type, track_index } = req.query;

  if (!id || !extract_type || !track_index) return res.status(400).send('No id or extract_type provided');

  if (['audio', 'subtitle'].indexOf(extract_type as string) === -1) return res.status(400).send('Invalid extract_type');

  const videoItem = getVideoItemById(parseInt(id as string, 10));
  if (!videoItem) return res.status(404).send('Video not found');

  const videoPath = videoItem.path;
  if (!videoPath) return res.status(404).send('Video has no path');

  try {
    ffmpeg.ffprobe(videoPath, async (err, metadata) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error extracting video metadata');
      }

      const extract_data = metadata.streams.find((stream) => stream.codec_type === extract_type);

      if (!extract_data || extract_data.length === 0) {
        return res.status(404).send('No extract data found');
      }

      const trackIndex = parseInt(track_index as string, 10);
      if (isNaN(trackIndex) || trackIndex < 0 || trackIndex >= extract_data.length) {
        return res.status(400).send('Invalid track_index');
      }

      const track = extract_data[trackIndex];

      if (extract_type === 'audio') {
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
        });

        ffmpeg(videoPath)
          .outputFormat('mp3')
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .outputOptions([`-map 0:a:${track.index}`])
          .on('error', (err) => {
            console.error(err);
            res.status(500).send('Error extracting audio');
          })
          .pipe(res, { end: true });
      } else if (extract_type === 'subtitle') {
        res.writeHead(200, {
          'Content-Type': 'text/vtt',
        });

        ffmpeg(videoPath)
          .outputFormat('webvtt')
          .outputOptions([`-map 0:s:${track.index}`, `-c:s webvtt`])
          .on('error', (err) => {
            console.error(err);
            res.status(500).send('Error extracting subtitle');
          })
          .pipe(res, { end: true });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
}

export { extractHandler };
