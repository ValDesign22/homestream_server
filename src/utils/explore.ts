import { readdirSync } from 'node:fs';
import { load_store } from './store';
import { IConfig, IFolder, IMovie, ITvShow, ITvShowEpisode, ITvShowSeason } from './types';
import { search_movie, search_tvshow, search_tvshow_episode, search_tvshow_season } from './tmdb';

const videoExtensions = ['avi', 'mkv', 'mp4', 'webm', 'wmv'];

const explore_movies = async (config: IConfig, folder: IFolder): Promise<IMovie[]> => {
  const stack = [folder.path];

  const movies: IMovie[] = [];
  const existing_movies = load_store(folder) as IMovie[];

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        if (item.name !== '.' && item.name !== '..') stack.push(`${current_path}/${item.name}`);
        continue;
      }

      if (!videoExtensions.includes(item.name.split('.').pop() as string)) continue;

      const existing_movie = existing_movies.find((movie) => movie.path === current_path);
      if (existing_movie) {
        movies.push(existing_movie);
        continue;
      }

      const file_name = item.name.split('.').shift() as string;
      let date = null;
      const date_match = file_name.match(/\d{4}/);
      if (date_match && date_match[0].length === 4 && date_match[0].length !== file_name.length && date_match[0].split('').every((char) => !isNaN(parseInt(char)))) date = date_match[0];
      const title = date ? file_name.split(' ').slice(0, -1).join(' ') : file_name;

      const movie = await search_movie(title, date, config);

      if (movie) movies.push({
        ...movie,
        path: `${current_path}/${item.name}`,
      });
    }
  }

  return movies;
};

const explore_tv_shows = async (config: IConfig, folder: IFolder): Promise<ITvShow[]> => {
  const stack = [folder.path];

  const tvshows: ITvShow[] = [];
  const existing_tvshows = load_store(folder) as ITvShow[];

  const cache = new Map<string, number>();

  while (stack.length > 0) {
    const current_path = stack.pop();
    if (!current_path) continue;

    const items = readdirSync(current_path, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && item.name === '.' || item.name === '..') continue;

      if (item.isDirectory()) {
        stack.push(`${current_path}/${item.name}`);
        continue;
      }

      if (!videoExtensions.includes(item.name.split('.').pop() as string)) continue;

      const filename = item.name;
      const episode_match = filename.match(/S\d{2} E\d{2}/);
      if (!episode_match) continue;
      const title = filename.split(episode_match[0]).shift()?.trim();
      if (!title) continue;

      let tvshow_id = cache.get(title);
      if (!tvshow_id) {
        const tvshow = await search_tvshow(title, null, config);
        if (!tvshow) continue;
        cache.set(title, tvshow.id);
        tvshow_id = tvshow.id;
      }

      const existing_tvshow = existing_tvshows.find((t) => t.id === tvshow_id);
      if (existing_tvshow && !tvshows.includes(existing_tvshow)) tvshows.push(existing_tvshow);
      const tvshow = existing_tvshow || tvshows.find((t) => t.id === tvshow_id);
      if (!tvshow) continue;

      const season_number = parseInt(episode_match[0].slice(1, 3));
      if (isNaN(season_number)) continue;

      let tvshow_season = tvshow.seasons.find((s) => s.season_number === season_number);
      if (!tvshow_season) {
        const season = await search_tvshow_season(tvshow_id, season_number, config);
        if (!season) continue;
        tvshow.seasons.push(season);
        tvshow_season = season;
      } else tvshow.seasons.push(tvshow_season);
      if (!tvshow_season) continue;

      const episode_number = parseInt(episode_match[0].slice(-2));
      if (isNaN(episode_number)) continue;

      const existing_episode = tvshow_season.episodes.find((e) => e.episode_number === episode_number);
      if (existing_episode) continue;

      const episode_data = await search_tvshow_episode(tvshow_id, season_number, episode_number, config);
      if (!episode_data) continue;
      tvshow_season.episodes.push({
        ...episode_data,
        path: `${current_path}/${item.name}`,
      });

      if (!tvshows.includes(tvshow)) tvshows.push(tvshow);
    }
  }

  return tvshows;
}

export { explore_movies, explore_tv_shows };