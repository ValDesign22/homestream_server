import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import axios from "axios";
import { get_config_path } from "../config.service";
import logger from "../logger.service";
import { LIBRARIES_PATH } from "../../utils/constants.util";
import { IFolder } from "../../utils/types/interfaces.util";

export const get_library_path = (folder: IFolder): string => {
  const libraries_path = join(get_config_path(), LIBRARIES_PATH, folder.id.toString());
  if (!existsSync(libraries_path)) mkdirSync(libraries_path, { recursive: true });
  return libraries_path;
};

export const download_image = async (url: string, path: string): Promise<void> => {
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

export const download_images_concurrently = async (images: { url: string, path: string }[]): Promise<void> => {
  try {
    await Promise.all(images.map(async ({ url, path }) => {
      await download_image(url, path);
    }));
  } catch (error) {
    logger.error('Failed to download images concurrently:', error);
  }
}
