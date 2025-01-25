import { exec } from 'node:child_process';

export const create_hls_stream = async (
  video_path: string,
  output_path: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const quality = {
      '360p': {
        resolution: { width: 640, height: 360 },
        video_bitrate: '800k',
        audio_bitrate: '96k',
      },
      '480p': {
        resolution: { width: 842, height: 480 },
        video_bitrate: '1400k',
        audio_bitrate: '128k',
      },
      '720p': {
        resolution: { width: 1280, height: 720 },
        video_bitrate: '2800k',
        audio_bitrate: '128k',
      },
      '1080p': {
        resolution: { width: 1920, height: 1080 },
        video_bitrate: '5000k',
        audio_bitrate: '192k',
      },
    };

    const template = (quality: {
      resolution: { width: number; height: number };
      video_bitrate: string;
      audio_bitrate: string;
    }) =>
      `-vf scale=w=${quality.resolution.width}:h=${quality.resolution.height}:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 \
      -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod \
      -b:v ${quality.video_bitrate} -maxrate ${parseInt(quality.video_bitrate) + 96}k \
      -bufsize ${parseInt(quality.video_bitrate) * 1.5}k -b:a ${quality.audio_bitrate} \
      -hls_segment_filename ${output_path}/${quality.resolution.width}p_%03d.ts ${output_path}/${quality.resolution.width}p.m3u8`;

    const command = `ffmpeg -hide_banner -y -i "${video_path}" \
      ${template(quality['360p'])} \
      ${template(quality['480p'])} \
      ${template(quality['720p'])} \
      ${template(quality['1080p'])}`;

    exec(command, (err, _stdout, _stderr) => {
      if (err) {
        reject(err);
        return;
      }

      if (_stderr) {
        reject(_stderr);
        return;
      }

      resolve();
    });
  });
};
