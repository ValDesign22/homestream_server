import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  get_item,
  store_item,
  store_tvshow_episode,
  store_tvshow_season,
} from '#/services/store.service';
import {
  IConfig,
  IFolder,
  ITvShow,
  ITvShowEpisode,
  ITvShowSeason,
} from '#/utils/types/interfaces.util';
import {
  BACKDROP_FILENAME,
  LOGO_FILENAME,
  METADATA_FILENAME,
  POSTER_FILENAME,
  STILL_FILENAME,
  VIDEO_EXTENSIONS,
} from '#/utils/constants.util';
import logger from '#/services/logger.service';
import {
  search_tvshow,
  search_tvshow_episode,
  search_tvshow_season,
} from '#/services/providers/tmdb/tv.service';
import { EImageType, EMediaType } from '#/utils/types/enums.util';
import { download_images_concurrently } from '#/services/library/index';
import { load_config } from '#/services/config.service';
import { parse } from 'yaml';

export const get_tvshow_image = (
  folder: IFolder,
  id: number,
  image_type: EImageType,
): string | null => {
  const item = get_item(folder, id);
  if (!item) return null;

  const image_path = join(
    item.path,
    image_type === EImageType.Backdrop
      ? BACKDROP_FILENAME
      : image_type === EImageType.Logo
        ? LOGO_FILENAME
        : POSTER_FILENAME,
  );

  const exists = existsSync(image_path);
  switch (image_type) {
    case EImageType.Backdrop:
      return exists
        ? image_path
        : item.metadata.backdrop_path
          ? `https://image.tmdb.org/t/p/original${item.metadata.backdrop_path}`
          : null;
    case EImageType.Logo:
      return exists
        ? image_path
        : item.metadata.logo_path
          ? `https://image.tmdb.org/t/p/original${item.metadata.logo_path}`
          : null;
    case EImageType.Poster:
      return exists
        ? image_path
        : item.metadata.poster_path
          ? `https://image.tmdb.org/t/p/original${item.metadata.poster_path}`
          : null;
    default:
      return null;
  }
};

export const get_season_image = (
  folder: IFolder,
  tvshow_id: number,
  season_number: number,
): string | null => {
  const item = get_item(folder, tvshow_id) as {
    path: string;
    metadata: ITvShow;
  } | null;
  if (!item) return null;

  const season = item.metadata.seasons.find(
    (season) => season.season_number === season_number,
  );
  if (!season) return null;

  const image_path = join(
    item.path,
    `S${season.season_number.toString().padStart(2, '0')}`,
    POSTER_FILENAME,
  );
  const exists = existsSync(image_path);

  return exists
    ? image_path
    : season.poster_path
      ? `https://image.tmdb.org/t/p/original${season.poster_path}`
      : null;
};

export const get_episode_image = (
  folder: IFolder,
  tvshow_id: number,
  season_number: number,
  episode_number: number,
): string | null => {
  const item = get_item(folder, tvshow_id) as {
    path: string;
    metadata: ITvShow;
  } | null;
  if (!item) return null;

  const season = item.metadata.seasons.find(
    (season) => season.season_number === season_number,
  );
  if (!season) return null;

  const episode = season.episodes.find(
    (episode) => episode.episode_number === episode_number,
  );
  if (!episode) return null;

  const image_path = join(
    item.path,
    season.season_number.toString().padStart(2, '0'),
    episode.episode_number.toString().padStart(2, '0'),
    STILL_FILENAME,
  );
  const exists = existsSync(image_path);

  return exists
    ? image_path
    : episode.still_path
      ? `https://image.tmdb.org/t/p/original${episode.still_path}`
      : null;
};

export const get_tvshow = (
  id: number,
): { path: string; metadata: ITvShow } | null => {
  const config = load_config();
  if (!config) return null;

  for (const folder of config.folders) {
    if (folder.media_type === EMediaType.TvShows) {
      const tvshow = get_item(folder, id);
      if (tvshow) return tvshow as { path: string; metadata: ITvShow };
    }
  }

  return null;
};

export const get_tvshow_season = (
  id: number,
  season_number: number,
): { path: string; metadata: ITvShowSeason } | null => {
  const tvshow = get_tvshow(id);
  if (!tvshow) return null;

  const season_path = join(
    tvshow.path,
    season_number.toString().padStart(2, '0'),
  );
  const metadata_path = join(season_path, METADATA_FILENAME);
  if (!existsSync(metadata_path)) return null;

  try {
    const metadataContent = readFileSync(metadata_path, 'utf-8');
    const metadata = parse(metadataContent);

    return {
      path: season_path,
      metadata: metadata as ITvShowSeason,
    };
  } catch (err) {
    logger.error(`Failed to get tvshow ${id} season ${season_number}:`, err);
    return null;
  }
};

const get_tvshow_episode = (
  id: number,
  season_number: number,
  episode_number: number,
): { path: string; metadata: ITvShowEpisode } | null => {
  const season = get_tvshow_season(id, season_number);
  if (!season) return null;

  const episode_path = join(
    season.path,
    episode_number.toString().padStart(2, '0'),
  );
  const metadata_path = join(episode_path, METADATA_FILENAME);
  if (!existsSync(metadata_path)) return null;

  try {
    const metadataContent = readFileSync(metadata_path, 'utf-8');
    const metadata = parse(metadataContent);

    return {
      path: episode_path,
      metadata: metadata as ITvShowEpisode,
    };
  } catch (err) {
    logger.error(
      `Failed to get tvshow ${id} season ${season_number} episode ${episode_number}:`,
      err,
    );
    return null;
  }
};

const parse_tvshow_filename = (
  filename: string,
): {
  title: string;
  year: string | null;
  season: string;
  episode: string;
} | null => {
  const regex = /^(.*?)\s*(?:\((\d{4})\))?\s*S(\d{2})\s*E(\d{2})$/;
  const match = filename.match(regex);

  if (!match) return null;

  const [title, year, season, episode] = match.slice(1);

  return { title, year, season, episode };
};

export const analyze_tvshows = async (
  folder: IFolder,
  { save_images }: IConfig,
): Promise<void> => {
  const stack: string[] = [folder.path];

  const images: { url: string; path: string }[] = [];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        if (item.name !== '.' && item.name !== '..')
          stack.push(join(current_path, item.name));
        continue;
      }

      if (!VIDEO_EXTENSIONS.includes(item.name.split('.').pop() as string))
        continue;

      const filename = item.name.split('.').shift() as string;
      const parsed_filename = parse_tvshow_filename(filename);
      if (!parsed_filename) continue;
      const { title, year, season, episode } = parsed_filename;
      const full_path = join(current_path, item.name);

      logger.info(
        `Analyzing tvshow: ${full_path}\n${title} (${year || 'Unknown Year'}) S${season}E${episode}`,
      );

      try {
        const tmdb_tvshow = await search_tvshow(title, year);
        if (!tmdb_tvshow) continue;
        if (!get_item(folder, tmdb_tvshow.id)) store_item(folder, tmdb_tvshow);

        const tvshow = get_item(folder, tmdb_tvshow.id) as {
          path: string;
          metadata: ITvShow;
        } | null;
        if (!tvshow) continue;

        const tmdb_season = await search_tvshow_season(
          tmdb_tvshow.id,
          parseInt(season),
        );
        if (!tmdb_season) continue;
        if (!get_tvshow_season(tmdb_tvshow.id, tmdb_season.season_number))
          store_tvshow_season(folder, tmdb_tvshow.id, tmdb_season);

        const tvshow_season = get_tvshow_season(
          tmdb_tvshow.id,
          tmdb_season.season_number,
        );
        if (!tvshow_season) continue;

        const tmdb_episode = await search_tvshow_episode(
          tmdb_tvshow.id,
          parseInt(season),
          parseInt(episode),
        );
        if (!tmdb_episode) continue;
        if (
          !get_tvshow_episode(
            tmdb_tvshow.id,
            tmdb_season.season_number,
            tmdb_episode.episode_number,
          )
        )
          store_tvshow_episode(
            tmdb_tvshow.id,
            tmdb_season.season_number,
            tmdb_episode,
          );

        const tvshow_episode = get_tvshow_episode(
          tmdb_tvshow.id,
          tmdb_season.season_number,
          tmdb_episode.episode_number,
        );
        if (!tvshow_episode) continue;

        if (save_images) {
          if (
            tmdb_tvshow.backdrop_path &&
            !get_tvshow_image(folder, tmdb_tvshow.id, EImageType.Backdrop)
          )
            images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_tvshow.backdrop_path}`,
              path: join(tvshow.path, BACKDROP_FILENAME),
            });
          if (
            tmdb_tvshow.logo_path &&
            !get_tvshow_image(folder, tmdb_tvshow.id, EImageType.Logo)
          )
            images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_tvshow.logo_path}`,
              path: join(tvshow.path, LOGO_FILENAME),
            });
          if (
            tmdb_tvshow.poster_path &&
            !get_tvshow_image(folder, tmdb_tvshow.id, EImageType.Poster)
          )
            images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_tvshow.poster_path}`,
              path: join(tvshow.path, POSTER_FILENAME),
            });
          if (
            tmdb_season.poster_path &&
            !get_season_image(folder, tmdb_tvshow.id, tmdb_season.season_number)
          )
            images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_season.poster_path}`,
              path: join(tvshow_season.path, POSTER_FILENAME),
            });
          if (
            tmdb_episode.still_path &&
            !get_episode_image(
              folder,
              tmdb_tvshow.id,
              tmdb_season.season_number,
              tmdb_episode.episode_number,
            )
          )
            images.push({
              url: `https://image.tmdb.org/t/p/original${tmdb_episode.still_path}`,
              path: join(tvshow_episode.path, STILL_FILENAME),
            });
        }

        store_tvshow_season(folder, tmdb_tvshow.id, {
          ...tvshow_season.metadata,
          episodes: [...tvshow_season.metadata.episodes, tmdb_episode],
        });

        const edited_season = get_tvshow_season(
          tmdb_tvshow.id,
          tmdb_season.season_number,
        );
        if (!edited_season) continue;

        store_item(folder, {
          ...tvshow.metadata,
          seasons: tvshow.metadata.seasons.map((season) =>
            season.season_number === tmdb_season.season_number
              ? edited_season.metadata
              : season,
          ),
        });

        logger.info(
          `Analyzed tvshow: ${full_path}\n${title} (${year || 'Unknown Year'}) S${season}E${episode}`,
        );
      } catch (error) {
        logger.error(
          `Error analyzing tvshow: ${full_path}\n${title} (${year || 'Unknown Year'}) S${season}E${episode}`,
        );
        logger.error(error);
      }
    }
  }

  await download_images_concurrently(images);
};
