import { get_movie, get_movie_image } from '#/services/library/movie.service';
import logger from '#/services/logger.service';
import { EImageType } from '#/utils/types/enums.util';
import { Controller, Get } from '@nuxum/core';
import axios from 'axios';
import { Request, Response } from 'express';

@Controller('/movies/:id')
export class MovieController {
  @Get()
  public async get(req: Request, res: Response) {
    return res.status(200).json({ message: 'Movie found' });
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

    if (!!image && new URL(image)) {
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
}
