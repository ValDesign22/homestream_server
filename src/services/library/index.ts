import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import axios from 'axios';
import { analyze_collections } from '#/services/library/collection.service';
import { analyze_movies } from '#/services/library/movie.service';
import { analyze_tvshows } from '#/services/library/tv.service';
import { get_config_path } from '#/services/config.service';
import logger from '#/services/logger.service';
import { LIBRARIES_PATH } from '#/utils/constants.util';
import { EMediaType } from '#/utils/types/enums.util';
import { IConfig, IFolder } from '#/utils/types/interfaces.util';

export const get_library_path = (folder: IFolder): string => {
  const libraries_path = join(
    get_config_path(),
    LIBRARIES_PATH,
    folder.id.toString(),
  );
  if (!existsSync(libraries_path))
    mkdirSync(libraries_path, { recursive: true });
  return libraries_path;
};

export const download_image = async (
  url: string,
  path: string,
): Promise<void> => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = createWriteStream(path);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    logger.error(`Failed to download image from URL: ${url}`, error);
  }
};

export const download_images_concurrently = async (
  images: { url: string; path: string }[],
): Promise<void> => {
  try {
    await Promise.all(
      images.map(async ({ url, path }) => {
        await download_image(url, path);
      }),
    );
  } catch (error) {
    logger.error('Failed to download images concurrently:', error);
  }
};

export const analyze_library = async (
  folder: IFolder,
  config: IConfig,
): Promise<void> => {
  switch (folder.media_type) {
    case EMediaType.Movies:
      await analyze_movies(folder, config);
      if (config.create_collections) await analyze_collections(folder, config);
      break;
    case EMediaType.TvShows:
      await analyze_tvshows(folder, config);
      break;
  }
};
