import { Controller, Get, Patch } from '@nuxum/core';
import { Request, Response } from 'express';
import { EMediaType, IGenre, IMovie, ITvShow } from '../utils/types';
import { searchItemById } from '../utils/item';
import { load_config } from '../utils/config';
import { create_request, fetch_images } from '../utils/tmdb';
import { load_store, save_store } from '../utils/store';

@Controller('/details')
export class DetailsController {
  @Get({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public get(req: Request, res: Response) {
    const { id } = req.query;
    let item = searchItemById(parseInt(id as string, 10));
    if (!item) {
      item = searchItemById(parseInt(id as string, 10), true);
      if (!item) return res.status(404).json({ message: 'Video not found' });
    }
    return res.status(200).json(item);
  }

  @Patch({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }, {
      type: 'number',
      required: true,
      name: 'new_id',
    }, {
      type: 'number',
      required: true,
      name: 'type',
    }],
  })
  public async patch(req: Request, res: Response) {
    const { id, new_id, type } = req.query;
    const item = searchItemById(parseInt(id as string, 10)) as IMovie | ITvShow | null;
    if (!item || !item.id) return res.status(404).json({ message: 'Item not found' });

    if (parseInt(type as string, 10) === EMediaType.TvShows) return res.status(400).json({ message: 'Cannot patch Tv Shows' });

    const { tmdb_language, folders } = load_config();

    const response = await create_request(`https://api.themoviedb.org/3/movie/${new_id}?language=${tmdb_language}&append_to_response=release_dates`);
    if (!response) return res.status(404).json({ message: 'Movie not found' });

    const genres: IGenre[] = response.genres ? response.genres.map((genre: any) => {
      return {
        id: genre.id,
        name: genre.name,
      };
    }) : [];

    const images = await fetch_images(parseInt(new_id as string, 10), EMediaType.Movies, tmdb_language);

    const folder = folders.find((folder) => (item as IMovie).path!.startsWith(folder.path));
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const store = load_store(folder) as IMovie[];
    const index = store.findIndex((movie) => movie.id === parseInt(id as string, 10));
    if (index === -1) return res.status(404).json({ message: 'Item not found' });
    store[index] = {
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
      path: (item as IMovie).path,
    };
    save_store(folder, store);

    return res.status(200).json(store[index]);
  }
}
