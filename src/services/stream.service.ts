import { exec } from 'node:child_process';
import { join } from 'node:path';

export const create_hls_stream = async (
  video_path: string,
  output_path: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const quality = {
      '360p': {
        width: 640,
        height: 360,
        video_bitrate: '800k',
        audio_bitrate: '96k',
      },
      '480p': {
        width: 842,
        height: 480,
        video_bitrate: '1400k',
        audio_bitrate: '128k',
      },
      '720p': {
        width: 1280,
        height: 720,
        video_bitrate: '2800k',
        audio_bitrate: '128k',
      },
      '1080p': {
        width: 1920,
        height: 1080,
        video_bitrate: '5000k',
        audio_bitrate: '192k',
      },
    };

    let ffmpegCommand = `ffmpeg -hide_banner -y -i "${video_path}" -preset veryfast -start_number 0 -hls_time 4 -hls_list_size 0`;

    Object.entries(quality).forEach(([key, q]) => {
      const outputM3U8 = join(output_path, `${key}.m3u8`);
      const segmentFile = join(output_path, `${key}_%03d.ts`);

      ffmpegCommand += ` -map v:0 -map a:0 -vf scale=${q.width}:${q.height} -c:v h264 -b:v ${q.video_bitrate} -maxrate ${q.video_bitrate} -bufsize ${parseInt(q.video_bitrate) * 2}k -c:a aac -b:a ${q.audio_bitrate} -hls_segment_filename "${segmentFile}" "${outputM3U8}"`;
    });

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        reject(stderr);
        return;
      }

      resolve();
    });
  });
};
