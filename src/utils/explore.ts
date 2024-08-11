import { readdirSync } from 'fs';
import { load_store } from './store';
import { IConfig, IFolder, IMovie, ITvShow, ITvShowEpisode, ITvShowSeason } from './types';
import { search_movie, search_tvshow, search_tvshow_episode, search_tvshow_season } from './tmdb';

const explore_movies_folder = async (config: IConfig, folder: IFolder): Promise<IMovie[]> => {
  const stack = [folder.path];

  const movies: IMovie[] = [];
  const existing_movies = load_store(folder) as IMovie[];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, {
      withFileTypes: true,
    });

    for (const item of items) {
      if (item.isDirectory() && item.name === '.' || item.name === '..') continue;

      if (item.isDirectory()) {
        stack.push(`${current_path}/${item.name}`);
        continue;
      }

      const existing_movie = existing_movies.find((movie) => movie.path === current_path);
      if (existing_movie) {
        movies.push(existing_movie);
        continue;
      }

      const file_name = item.name.split('.').shift() as string;
      let date = null;
      const date_match = file_name.match(/\d{4}/);
      if (date_match && date_match[0].length === 4 && date_match[0].length !== file_name.length && date_match[0].split('').every((char) => !isNaN(parseInt(char)))) {
        date = date_match[0];
      }
      const title = date ? file_name.split(' ').slice(0, -1).join(' ') : file_name;

      const movie = await search_movie(title, date, config);

      if (movie) {
        movies.push({
          ...movie,
          path: `${current_path}/${item.name}`,
        });
      }
    }
  }

  return movies;
};

const explore_tvshows_folder = async (config: IConfig, folder: IFolder): Promise<ITvShow[]> => {
  const stack = [folder.path];

  const tvshows: ITvShow[] = [];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, {
      withFileTypes: true,
    });

    for (const item of items) {
      if (item.isDirectory() && item.name === '.' || item.name === '..') continue;

      if (item.isFile()) {
        continue;
      }

      let date = null;
      const date_match = item.name.match(/\d{4}/);
      if (date_match && date_match[0].length === 4 && date_match[0].length !== item.name.length && date_match[0].split('').every((char) => !isNaN(parseInt(char)))) {
        date = date_match[0];
      }
      const title = date ? item.name.split(' ').slice(0, -1).join(' ') : item.name;

      const tvshow = await search_tvshow(title, date, config);
      if (tvshow) {
        const seasons = await explore_tvshow_seasons(config, folder, tvshow, `${current_path}/${item.name}`);
        console.log(`TV Show: ${tvshow.title} - Seasons: ${seasons}`);
        tvshows.push({
          ...tvshow,
          seasons,
          path: `${current_path}/${item.name}`,
        });
      }
    }
  }

  return tvshows;
};

const explore_tvshow_seasons = async (config: IConfig, folder: IFolder, tvshow: ITvShow, path: string): Promise<ITvShowSeason[]> => {
  const stack = [path];

  const seasons: ITvShowSeason[] = [];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, {
      withFileTypes: true,
    });

    for (const item of items) {
      if (item.isDirectory() && item.name === '.' || item.name === '..') continue;

      if (item.isFile()) {
        continue;
      }

      console.log(`TV Show: ${tvshow.title} - Season: ${item.name}`);

      const season_match = item.name.match(/\d+/g);
      if (!season_match) {
        console.log(`Invalid season number: ${item.name}`);
        continue;
      }
      const season_number = season_match[0];

      console.log(`Season number: ${season_number}`);
      const season = await search_tvshow_season(tvshow.id, parseInt(season_number), config);
      console.log(`Season details: ${season}`);
      if (season) {
        const episodes = await explore_tvshow_episodes(config, folder, tvshow, season, `${current_path}/${item.name}`);
        console.log(`TV Show: ${tvshow.title} - Season: ${season.name} - Episodes: ${episodes}`);
        seasons.push({
          ...season,
          episodes,
          path: `${current_path}/${item.name}`,
        });
        console.log(seasons);
      }
    }
  }

  return seasons;
};

const explore_tvshow_episodes = async (config: IConfig, folder: IFolder, tvshow: ITvShow, season: ITvShowSeason, path: string): Promise<ITvShowEpisode[]> => {
  const stack = [path];

  const episodes: ITvShowEpisode[] = [];
  const existing_tvshows = load_store(folder) as ITvShow[];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, {
      withFileTypes: true,
    });

    for (const item of items) {
      if (item.isDirectory() && item.name === '.' || item.name === '..') continue;

      if (item.isDirectory()) {
        stack.push(`${current_path}/${item.name}`);
        continue;
      }

      console.log(`TV Show: ${tvshow.title} - Season: ${season.name} - Episode: ${item.name}`);

      const existing_tvshow = existing_tvshows.find((t) => t.path === tvshow.path);
      if (existing_tvshow) {
        const existing_season = existing_tvshow.seasons.find((s) => s.path === season.path);
        if (existing_season) {
          const existing_episode = existing_season.episodes.find((e) => e.path === `${current_path}/${item.name}`);
          if (existing_episode) {
            episodes.push(existing_episode);
            continue;
          }
        }
      }

      const episode_number = (() => {
        const firstSplit = item.name.split('.').shift();
        if (!firstSplit) return null;
        const lastWord = firstSplit.trim().split(/\s+/).pop();
        if (!lastWord) return null;
        const epidosePart = lastWord.replace('E', '');
        if (!epidosePart) return null;
        if ([...epidosePart].every((char) => !isNaN(parseInt(char)))) return parseInt(epidosePart);
        return null;
      })();

      if (!episode_number) continue;

      const episode = await search_tvshow_episode(tvshow.id, season.season_number, episode_number, config);
      if (episode) {
        console.log(`Episode details: ${episode}`);
        episodes.push({
          ...episode,
          path: `${current_path}/${item.name}`,
        });
        console.log(`Episodes: ${episodes}`);
      }
    }
  }

  return episodes;
};

export { explore_movies_folder, explore_tvshows_folder };