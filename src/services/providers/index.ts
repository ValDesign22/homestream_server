import { IMovie, ITvShow } from "../../utils/types/interfaces.util";
import { tmdb_search } from "./tmdb.service";

export const search = async (query: string, type: string): Promise<IMovie[] | ITvShow[]> => {
  switch (type) {
    case 'movie':
    case 'tv':
      return await tmdb_search(query, type);
    default:
      return [];
  }
};