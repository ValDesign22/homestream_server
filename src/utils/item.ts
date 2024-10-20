import { load_config } from './config';
import { load_store } from './store';
import { EMediaType, IMovie, ITvShow, ITvShowEpisode } from './types';

const getVideoItemById = (id: number): IMovie | ITvShowEpisode | null => {
  const config = load_config();
  const stores: Record<string, IMovie[] | ITvShow[]> = {};
  for (const folder of config.folders) stores[folder.name] = load_store(folder);

  const stack: (IMovie | ITvShowEpisode)[] = [];
  const visited = new Set<number>();

  for (const storeKey in stores) {
    const store = stores[storeKey];
    if (!store.length) continue;

    if (store[0].hasOwnProperty('collection_id')) stack.push(...store as IMovie[]);
    else for (const tvShow of store as ITvShow[]) {
      for (const season of tvShow.seasons) stack.push(...season.episodes);
    }
  }

  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (visited.has(item.id)) continue;
    visited.add(item.id);

    if (item.id === id) return item;
  }

  return null;
};

const searchItemById = (id: number): IMovie | ITvShow | null => {
  const config = load_config();
  const stores: Record<string, IMovie[] | ITvShow[]> = {};
  for (const folder of config.folders) stores[folder.name] = load_store(folder);

  const stack: (IMovie | ITvShow)[] = [];
  const visited = new Set<number>();

  for (const storeKey in stores) {
    const store = stores[storeKey];
    if (!store.length) continue;

    if (store[0].hasOwnProperty('collection_id')) stack.push(...store as IMovie[]);
    else stack.push(...store as ITvShow[]);
  }

  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (visited.has(item.id)) continue;
    visited.add(item.id);

    if (item.id === id) return item;
  }

  return null;
};

const getCollectionById = (id: number): IMovie[] => {
  const config = load_config();
  const stores: Record<string, IMovie[]> = {};
  for (const folder of config.folders) {
    if (folder.media_type === EMediaType.Movies) stores[folder.name] = load_store(folder) as IMovie[];
  }

  const stack: IMovie[] = [];
  const collection: IMovie[] = [];

  for (const storeKey in stores) {
    const store = stores[storeKey];
    if (!store.length) continue;

    stack.push(...store);
  }

  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;

    if (item.collection_id === id) collection.push(item);
  }

  return collection;
}

export { getVideoItemById, searchItemById, getCollectionById };
