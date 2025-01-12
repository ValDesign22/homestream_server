import { join } from 'node:path';
import ffmpeg from 'fluent-ffmpeg';

export const create_hls_stream = async (
  video_path: string,
  output_dir: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(video_path)
      .outputOptions([
        '-preset veryfast',
        '-g 48',
        '-sc_threshold 0',
        '-hls_time 4',
        '-hls_playlist_type vod',
        '-hls_segment_filename',
        join(output_dir, 'segment_%03d.ts'),
      ])
      .output(join(output_dir, 'index.m3u8'))
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run();
  });
};
