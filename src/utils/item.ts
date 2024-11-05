import { load_config } from './config';
import { load_store } from './store';
import { EMediaType, IConfig, IMovie, ITvShow, ITvShowEpisode } from './types';

const searchItemById = (id: number, isEpisodeSearch: boolean = false): IMovie | ITvShow | ITvShowEpisode | null => {
  const config = load_config();
  const stack: (IMovie | ITvShow | ITvShowEpisode)[] = [];
  const visited = new Set<number>();
  const stores: Record<string, IMovie[] | ITvShow[]> = {};
  for (const folder of config.folders) stores[folder.name] = load_store(folder);

  for (const store of Object.values(stores)) {
    if (!store.length) continue;

    if (store[0].hasOwnProperty('collection_id')) stack.push(...store as IMovie[]);
    else if (isEpisodeSearch) {
      for (const tvShow of store as ITvShow[]) {
        for (const season of tvShow.seasons) stack.push(...season.episodes);
      }
    } else stack.push(...store as ITvShow[]);
  }

  while (stack.length) {
    const item = stack.pop();
    if (item && !visited.has(item.id)) {
      visited.add(item.id);
      if (item.id === id) return item;
    }
  }

  return null;
};

const getCollectionById = (id: number): IMovie[] => {
  const config = load_config();
  const movies: IMovie[] = [];

  for (const folder of config.folders) {
    if (folder.media_type === EMediaType.Movies) movies.push(...load_store(folder) as IMovie[]);
  }

  return movies.filter((movie) => movie.collection_id === id);
}

export { searchItemById, getCollectionById };
