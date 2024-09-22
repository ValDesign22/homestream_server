import express from 'express';
import { Controller, HttpMethod, Route } from '../utils/route.js';
import { EMediaType, IGenre, IMovie, ITvShow, ITvShowEpisode } from '../utils/types.js';
import { getVideoItemById, searchItemById } from '../utils/item.js';
import { create_request, fetch_images } from '../utils/tmdb.js';
import { load_config } from '../utils/config.js';
import { load_store, save_store } from '../utils/store.js';

class DetailsController extends Controller {
  @Route({
    path: '/details',
    method: HttpMethod.GET,
    query: ['id'],
  })
  public get(req: express.Request, res: express.Response) {
    const { id } = req.query;
    let item: IMovie | ITvShow | ITvShowEpisode | null = searchItemById(parseInt(id as string, 10));
    if (!item) {
      item = getVideoItemById(parseInt(id as string, 10));
      if (!item) return this.sendError(res, 'Video not found', 404);
    }
    return this.sendResponse(res, item);
  }

  @Route({
    path: '/details',
    method: HttpMethod.PATCH,
    query: ['id', 'new_id', 'type'],
  })
  public async patch(req: express.Request, res: express.Response) {
    const { id, new_id, type } = req.query;
    const item: IMovie | ITvShow | null = searchItemById(parseInt(id as string, 10));
    if (!item || !item.path) return this.sendError(res, 'Item not found', 404);

    if (parseInt(type as string, 10) === EMediaType.TvShows) return this.sendError(res, 'Cannot patch Tv Shows', 400);

    const config = load_config();
    const { tmdb_language, folders } = config;

    const response = await create_request(`https://api.themoviedb.org/3/movie/${new_id}?language=${tmdb_language}&append_to_response=release_dates`);
    if (!response) return this.sendError(res, 'Movie not found', 404);

    const genres: IGenre[] = response.genres ? response.genres.map((genre: any) => {
      return {
        id: genre.id,
        name: genre.name,
      };
    }) : [];

    const images = await fetch_images(parseInt(new_id as string, 10), EMediaType.Movies, config);

    const newItem: IMovie = {
      id: response.id,
      collection_id: response.belongs_to_collection ? response.belongs_to_collection.id : null,
      title: response.title,
      original_title: response.original_title,
      overview: response.overview,
      poster_path: images.poster_path,
      backdrop_path: images.backdrop_path,
      logo_path: images.logo_path,
      release_date: response.release_date,
      runtime: response.runtime,
      genres,
      path: item.path,
    };

    const folder = folders.find((folder) => item.path!.startsWith(folder.path));
    if (!folder) return this.sendError(res, 'Folder not found', 404);
    const store = load_store(folder) as IMovie[];
    const index = store.findIndex((movie) => movie.id === parseInt(id as string, 10));
    if (index === -1) return this.sendError(res, 'Item not found', 404);
    store[index] = newItem;
    save_store(folder, store);

    return this.sendResponse(res, newItem);
  }
}

export const detailsController = new DetailsController();
