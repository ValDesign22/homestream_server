import { IMovie, ITvShow } from "../../utils/types/interfaces.util";
import { tmdb_search } from "./tmdb.service";

export const search = async (query: string, type: string): Promise<IMovie[] | ITvShow[]> => {
  switch (type) {
    case 'movie':
      await tmdb_search(query, type);
    case 'tv':
      await tmdb_search(query, type);
    default:
      return [];
  }
};