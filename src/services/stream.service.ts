import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import logger from './logger.service';

export const create_hls_stream = (
  video_path: string,
  output_path: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!existsSync(output_path)) mkdirSync(output_path, { recursive: true });

    const ffmpeg_args = [
      '-hide_banner',
      '-y',
      '-i',
      video_path,
      '-preset',
      'veryfast',
      '-start_number',
      '0',
      '-hls_time',
      '4',
      '-hls_list_size',
      '0',
      '-hls_flags',
      'delete_segments+append_list',
      '-hls_segment_filename',
      join(output_path, 'segment_%03d.ts'),
      join(output_path, 'playlist.m3u8'),
    ];

    const ffmpeg = spawn('ffmpeg', ffmpeg_args);

    ffmpeg.stdout.on('data', (data) => logger.info(data.toString()));
    ffmpeg.stderr.on('data', (data) => logger.error(data.toString()));

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(`ffmpeg process exited with code ${code}`);
    });
  });
};
