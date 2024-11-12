import chalk from 'chalk';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { IMovie, ITrack, ITvShowEpisode } from './types';
import ffmpeg from 'fluent-ffmpeg';
import { load_config } from './config';

function createSubtitlesFolder(): void {
  const config = load_config();
  if (!config) return;
  const { app_storage_path } = config;
  if (!existsSync(app_storage_path)) return;

  const subtitlesPath = `${app_storage_path}/subtitles`;
  if (!existsSync(subtitlesPath)) return;

  return mkdirSync(subtitlesPath);
}

function deleteSubtitles(item: IMovie | ITvShowEpisode): void {
  const config = load_config();
  if (!config) return;
  const { app_storage_path } = config;
  if (!existsSync(app_storage_path)) return;

  const subtitlesPath = `${app_storage_path}/subtitles`;
  if (!existsSync(subtitlesPath)) return;

  const files = readdirSync(subtitlesPath);

  for (const file of files) if (file.startsWith(`${item.id}_`)) unlinkSync(`${subtitlesPath}/${file}`);
}

function extractSubtitles(item: IMovie | ITvShowEpisode): void {
  if (!item.path) return;

  ffmpeg.ffprobe(item.path, async (error, metadata) => {
    if (error) return console.error(error);

    const subtitles = metadata.streams.filter((stream) => stream.codec_type === 'subtitle');

    const tracks = subtitles.map((subtitle, index) => ({
      index,
      codec_name: subtitle.codec_name,
      codec_type: subtitle.codec_type,
      channel_layout: subtitle.channel_layout,
      language: subtitle.tags.language,
      handler_name: subtitle.tags.handler_name,
      default: subtitle.disposition?.default === 1,
      url: `/track?id=${item.id}&extract_type=${subtitle.codec_type}&track_index=${index}`,
    })) as ITrack[];

    console.log(`[${chalk.green('TRACKS')}] Extracting ${tracks.length} subtitles for ${item.title}`);

    for (const track of tracks) if (track.codec_name && !subtitleExists(item, track.index, track.codec_name))
      extractSubtitle(item, track.index, track.codec_name)
        .then((destination) => console.log(`[${chalk.green('TRACKS')}] Extracted subtitle ${track.index + 1}/${tracks.length} for ${item.id} at ${destination}`))
        .catch((error) => console.error(error));

    console.log(`[${chalk.green('TRACKS')}] Extracted ${tracks.length} subtitles for ${item.title}`);
  });
}

function extractSubtitle(item: IMovie | ITvShowEpisode, track_index: number, codec_name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = load_config();
    if (!config) return reject('Config does not exist');
    const { app_storage_path } = config;
    if (!existsSync(app_storage_path)) return reject('App storage path does not exist');
    if (!existsSync(`${app_storage_path}/subtitles`)) createSubtitlesFolder();

    if (!item.path) return reject('Item has no path');

    const destination = join(
      app_storage_path,
      'subtitles',
      `${item.id}_${track_index}.${codec_name === 'ass' ? 'ass' : 'vtt'}`
    );

    ffmpeg(item.path)
      .noAudio()
      .noVideo()
      .outputOptions(['-map 0:s:' + track_index])
      .outputFormat(codec_name === 'ass' ? 'ass' : 'webvtt')
      .saveToFile(destination)
      .on('end', () => resolve(destination))
      .on('error', (error) => reject(error));

    console.log(`[${chalk.green('TRACKS')}] Extracting subtitle ${track_index} for ${item.id}`);

    return destination;
  });
}

function subtitleExists(item: IMovie | ITvShowEpisode, track_index: number, codec_name: string): boolean {
  const config = load_config();
  if (!config) return false;
  const { app_storage_path } = config;
  if (!existsSync(app_storage_path)) return false;
  if (!existsSync(`${app_storage_path}/subtitles`)) createSubtitlesFolder();

  if (!item.path) return false;

  const destination = join(
    app_storage_path,
    'subtitles',
    `${item.id}_${track_index}.${codec_name === 'ass' ? 'ass' : 'vtt'}`
  );
  return existsSync(destination);
}

function getSubtitlePath(item: IMovie | ITvShowEpisode, track_index: number, codec_name: string): string | null {
  const config = load_config();
  if (!config) return null;
  const { app_storage_path } = config;
  if (!existsSync(app_storage_path)) return null;
  if (!existsSync(`${app_storage_path}/subtitles`)) createSubtitlesFolder();

  if (!subtitleExists(item, track_index, codec_name)) return null;

  return join(
    app_storage_path,
    'subtitles',
    `${item.id}_${track_index}.${codec_name === 'ass' ? 'ass' : 'vtt'}`
  );
}

export { deleteSubtitles, extractSubtitles, extractSubtitle, subtitleExists, getSubtitlePath };