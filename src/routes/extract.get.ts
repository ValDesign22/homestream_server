import { Request, Response } from 'express';
import { getVideoItemById } from '../utils/item';
import ffmpeg from 'fluent-ffmpeg';

const extractHandler = (req: Request, res: Response) => {
  const { id, extract_type, track_index } = req.query;

  if (!id || !extract_type || !track_index) {
    const missingFields = ['id', 'extract_type', 'track_index'].filter((field) => !req.query[field]);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  if (!['audio', 'subtitle'].includes(extract_type as string)) return res.status(400).json({ message: 'Invalid extract_type' });

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

      const extract_data = metadata.streams.filter((stream) => stream.codec_type === extract_type);

      if (!extract_data || extract_data.length === 0) return res.status(404).json({ message: 'No extract data found' });

      const trackIndex = parseInt(track_index as string, 10);
      if (isNaN(trackIndex) || trackIndex < 0) return res.status(400).json({ message: 'Invalid track_index' });

      const track = extract_data.find((stream) => stream.index === trackIndex);
      if (!track) return res.status(404).json({ message: 'Track not found' });
      console.log(track);

      if (extract_type === 'audio') {
        ffmpeg(videoPath)
          .outputFormat('mp3')
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .outputOptions([`-map 0:a:${trackIndex}?`])
          .on('error', (error) => {
            if (!res.headersSent) res.status(500).json({ message: 'Error extracting audio', error });
          })
          .pipe(res.writeHead(200, { 'Content-Type': 'audio/mpeg' }), { end: true });
      } else if (extract_type === 'subtitle') {
        ffmpeg(videoPath)
          .outputFormat('webvtt')
          .outputOptions([`-map 0:s:${trackIndex}?`, `-c:s webvtt`])
          .on('error', (error) => {
            if (!res.headersSent) res.status(500).json({ message: 'Error extracting subtitle', error });
          })
          .pipe(res.writeHead(200, { 'Content-Type': 'text/vtt' }), { end: true });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
}

export { extractHandler };
