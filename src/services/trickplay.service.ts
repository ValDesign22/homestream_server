import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import logger from './logger.service';

export const generate_trickplay = async (
  video_path: string,
  output_path: string,
  delay_ms: number,
  resolution: { width: number; height: number },
  grid_size: { rows: number; cols: number },
) => {
  if (!existsSync(output_path)) mkdirSync(output_path, { recursive: true });

  const thumbsnail_dir = join(output_path, 'thumbsnails');
  if (!existsSync(thumbsnail_dir))
    mkdirSync(thumbsnail_dir, { recursive: true });

  const temp_dir = join(output_path, 'temp');
  if (!existsSync(temp_dir)) mkdirSync(temp_dir, { recursive: true });

  logger.info('Generating trickplay thumbnails...');
  await new Promise<void>((resolve, reject) => {
    ffmpeg(video_path)
      .outputOptions([
        `-vf fps=1/${Math.ceil(delay_ms / 1000)}`,
        `-s ${resolution.width}x${resolution.height}`,
      ])
      .output(join(temp_dir, 'frame-%04d.jpg'))
      .on('start', (cmd) => logger.info(`Running command: ${cmd}`))
      .on('progress', (progress) => {
        logger.info(
          `Processing: ${progress.frames} frames done, ${progress.timemark} elapsed`,
        );
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .on('stderr', (stderr) => logger.error(stderr))
      .run();
  });

  logger.info('Creating trickplay grid...');
  const frame_files = readdirSync(temp_dir)
    .filter((file) => file.endsWith('.jpg'))
    .sort();

  const { rows, cols } = grid_size;
  const grid_width = resolution.width * cols;
  const grid_height = resolution.height * rows;

  let current_grid_index = 0;
  let current_row = 0;
  let current_col = 0;

  const canvas = createCanvas(grid_width, grid_height);
  const ctx = canvas.getContext('2d');

  for (const [index, frame_file] of frame_files.entries()) {
    const frame_path = join(temp_dir, frame_file);
    const image = await loadImage(frame_path);

    const x = current_col * resolution.width;
    const y = current_row * resolution.height;
    ctx.drawImage(image, x, y, resolution.width, resolution.height);

    current_col++;
    if (current_col >= cols) {
      current_col = 0;
      current_row++;
    }

    if (current_row >= rows || index === frame_files.length - 1) {
      const grid_path = join(
        thumbsnail_dir,
        `grid-${String(current_grid_index).padStart(4, '0')}.jpg`,
      );
      const out = createWriteStream(grid_path);
      const stream = canvas.createJPEGStream();
      stream.pipe(out);

      await new Promise<void>((resolve) => out.on('finish', resolve));
      logger.info(`Created grid ${grid_path}`);

      current_grid_index++;
      current_row = 0;
      current_col = 0;

      ctx.clearRect(0, 0, grid_width, grid_height);
    }

    logger.info(`Generated thumbnail ${index + 1}/${frame_files.length}`);
    unlinkSync(frame_path);
  }

  logger.info('Cleaning up...');
  rmdirSync(temp_dir, { recursive: true });
  logger.info('Trickplay thumbnails generated!');
};

export const get_trickplays = (dir_path: string) => {
  const thumbsnail_dir = join(dir_path, 'thumbsnails');
  if (!existsSync(thumbsnail_dir))
    throw new Error('Trickplay thumbnails not found');

  const grid_files = readdirSync(thumbsnail_dir)
    .filter((file) => file.endsWith('.jpg'))
    .sort();

  return grid_files.map((file) => join(thumbsnail_dir, file));
};
