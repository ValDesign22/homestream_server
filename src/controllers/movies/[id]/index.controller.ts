import { get_movie, get_movie_image } from '#/services/library/movie.service';
import logger from '#/services/logger.service';
import {
  generate_trickplay,
  get_trickplays,
} from '#/services/trickplay.service';
import { EImageType } from '#/utils/types/enums.util';
import { Controller, Get, Post } from '@nuxum/core';
import axios from 'axios';
import { Request, Response } from 'express';

@Controller('/movies/:id')
export class MovieController {
  @Get()
  public async get(req: Request, res: Response) {
    const { id } = req.params;

    const movie = get_movie(parseInt(id));

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    return res.status(200).json(movie);
  }

  @Get('/images/:type')
  public async get_image(req: Request, res: Response) {
    const { id, type } = req.params;

    const movie = get_movie(parseInt(id));

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const imagetype_map = {
      backdrop: EImageType.Backdrop,
      logo: EImageType.Logo,
      poster: EImageType.Poster,
    };

    const image = get_movie_image(
      movie.metadata.metadata.id,
      imagetype_map[type as keyof typeof imagetype_map],
    );

    if (!image) return res.status(404).json({ message: 'Image not found' });

    if (image.startsWith('http')) {
      logger.info(`Sending image from URL: ${image}`);
      const response = await axios.get(image, { responseType: 'arraybuffer' });
      res.setHeader(
        'Content-Type',
        response.headers['content-type'] || 'image/jpeg',
      );
      return res.status(200).send(response.data);
    }

    const mime_type = image.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return res
      .status(200)
      .sendFile(image, { headers: { 'Content-Type': mime_type } });
  }

  @Get('/trickplay')
  public async get_trickplays(req: Request, res: Response) {
    const { id } = req.params;

    const movie = get_movie(parseInt(id));

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const trickplay_images = get_trickplays(movie.path);

    if (!trickplay_images.length)
      return res.status(404).json({ message: 'Trickplay not found' });

    return res.status(200).json(trickplay_images);
  }

  @Get('/trickplay/:index')
  public async get_trickplay(req: Request, res: Response) {
    const { id, index } = req.params;

    const movie = get_movie(parseInt(id));

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const trickplay_images = get_trickplays(movie.path);

    if (!trickplay_images.length)
      return res.status(404).json({ message: 'Trickplay not found' });

    const image = trickplay_images[parseInt(index)];

    if (!image) return res.status(404).json({ message: 'Image not found' });

    return res
      .status(200)
      .sendFile(image, { headers: { 'Content-Type': 'image/jpeg' } });
  }

  @Post('/trickplay')
  public async post_trickplay(req: Request, res: Response) {
    const { id } = req.params;

    const movie = get_movie(parseInt(id));

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    logger.info(
      `Generating trickplay for movie: ${movie.metadata.metadata.title}`,
    );

    await generate_trickplay(
      movie.metadata.path,
      movie.path,
      10000,
      { width: 320, height: 180 },
      { rows: 10, cols: 10 },
    );

    logger.info('Trickplay generated');

    return res.status(200).json({ message: 'Trickplay generated' });
  }
}
