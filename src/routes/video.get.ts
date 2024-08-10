import { Request, Response } from 'express';
import { createReadStream, statSync } from 'fs';
import path from 'path';

const videoHandler = (req: Request, res: Response) => {
  const pathQuery = req.query.path;

  if (!pathQuery) return res.status(400).send('No video path provided');

  const decodedPath = decodeURIComponent(pathQuery as string);
  const VIDEOS_FOLDER = process.env.VIDEOS_FOLDER;
  if (!VIDEOS_FOLDER) return res.status(500).send('Videos folder not set');
  const videoPath = path.join(VIDEOS_FOLDER, decodedPath);

  const stat = statSync(videoPath);

  if (!stat.isFile()) return res.status(404).send('Video not found');

  const range = req.headers.range;
  if (!range) return res.status(400).send('Range header is required');

  const positions = range.replace(/bytes=/, '').split('-');
  const start = parseInt(positions[0], 10);
  const fileSize = stat.size;
  const end = positions[1] ? parseInt(positions[1], 10) : fileSize - 1;
  const chunksize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': 'video/mp4',
  });

  const stream = createReadStream(videoPath, { start, end })
    .on('open', () => stream.pipe(res))
    .on('error', res.end);
};

export { videoHandler };
