import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { IMovie, ITrack, ITvShowEpisode } from "./types.js";
import ffmpeg from 'fluent-ffmpeg';

function createSubtitlesFolder(): void {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return;
  if (!existsSync(APP_STORAGE_PATH)) return;

  const subtitlesPath = `${APP_STORAGE_PATH}/subtitles`;
  if (!existsSync(subtitlesPath)) return;

  return mkdirSync(subtitlesPath);
}

function deleteSubtitles(item: IMovie | ITvShowEpisode): void {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return;
  if (!existsSync(APP_STORAGE_PATH)) return;

  const subtitlesPath = `${APP_STORAGE_PATH}/subtitles`;
  if (!existsSync(subtitlesPath)) return;

  const files = readdirSync(subtitlesPath);

  for (const file of files) {
    if (file.startsWith(`${item.id}_`)) unlinkSync(`${subtitlesPath}/${file}`);
  }
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

    console.log(`Extracting ${tracks.length} subtitles for ${item.title}`);

    for (const track of tracks) {
      if (track.codec_name && !subtitleExists(item, track.index, track.codec_name))
        extractSubtitle(item, track.index, track.codec_name)
          .then((destination) => console.log(`Extracted subtitle ${track.index} for ${item.title} at ${destination}`))
          .catch((error) => console.error(error));
    }

    console.log(`Extracted ${tracks.length} subtitles for ${item.title}`);
  });
}

function extractSubtitle(item: IMovie | ITvShowEpisode, track_index: number, codec_name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
    if (!APP_STORAGE_PATH) return reject('APP_STORAGE_PATH not set');
    if (!existsSync(APP_STORAGE_PATH)) return reject('APP_STORAGE_PATH does not exist');
    if (!existsSync(`${APP_STORAGE_PATH}/subtitles`)) createSubtitlesFolder();

    if (!item.path) return reject('Item has no path');

    const destination = `${APP_STORAGE_PATH}/subtitles/${item.id}_${track_index}.${codec_name === 'ass' ? 'ass' : 'vtt'}`;

    ffmpeg(item.path)
      .noAudio()
      .noVideo()
      .outputOptions(['-map 0:s:' + track_index])
      .outputFormat(codec_name === 'ass' ? 'ass' : 'webvtt')
      .saveToFile(destination)
      .on('end', () => resolve(destination))
      .on('error', (error) => reject(error));

    console.log(`Extracting subtitle ${track_index} for ${item.title}`);

    return destination;
  });
}

function subtitleExists(item: IMovie | ITvShowEpisode, track_index: number, codec_name: string): boolean {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return false;
  if (!existsSync(APP_STORAGE_PATH)) return false;
  if (!existsSync(`${APP_STORAGE_PATH}/subtitles`)) createSubtitlesFolder();

  if (!item.path) return false;

  const destination = `${APP_STORAGE_PATH}/subtitles/${item.id}_${track_index}.${codec_name === 'ass' ? 'ass' : 'vtt'}`;
  return existsSync(destination);
}

function getSubtitlePath(item: IMovie | ITvShowEpisode, track_index: number, codec_name: string): string | null {
  const APP_STORAGE_PATH = process.env.APP_STORAGE_PATH;
  if (!APP_STORAGE_PATH) return null;
  if (!existsSync(APP_STORAGE_PATH)) return null;
  if (!existsSync(`${APP_STORAGE_PATH}/subtitles`)) createSubtitlesFolder();

  if (!subtitleExists(item, track_index, codec_name)) return null;

  return `${APP_STORAGE_PATH}/subtitles/${item.id}_${track_index}.${codec_name === 'ass' ? 'ass' : 'vtt'}`;
}

export { deleteSubtitles, extractSubtitles, extractSubtitle, subtitleExists, getSubtitlePath };