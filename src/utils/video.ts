import { load_config } from "./config";
import { load_store } from "./store";
import { IMovie, ITvShow, ITvShowEpisode } from "./types";

const getVideoItemById = (id: number): IMovie | ITvShowEpisode | null => {
  const config = load_config();
  const stores: Record<string, IMovie[] | ITvShow[]> = {};
  for (const folder of config.folders) stores[folder.name] = load_store(folder);

  const stack: (IMovie | ITvShowEpisode)[] = [];
  const visited = new Set<number>();

  for (const storeKey in stores) {
    const store = stores[storeKey];
    if (!store.length) continue;

    if (store[0].hasOwnProperty('collection_id')) {
      console.log('its a movies store');
      stack.push(...store as IMovie[]);
    }
    else {
      console.log('its a tv shows store');
      for (const tvShow of store as ITvShow[]) {
        for (const season of tvShow.seasons) stack.push(...season.episodes);
      }
    }
  }

  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (visited.has(item.id)) continue;
    visited.add(item.id);

    if (item.id === id) {
      console.log('found the video item');
      return item;
    };

    console.log('not the video item');
  }

  return null;
};

export { getVideoItemById };
