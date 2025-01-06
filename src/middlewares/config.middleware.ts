import { Injectable, NuxumMiddleware } from '@nuxum/core';
import { NextFunction, Request, Response } from 'express';
import { load_config } from '../services/config.service';

@Injectable()
export class ConfigMiddleware implements NuxumMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    if (load_config() || (req.path === '/config' && req.method === 'PATCH')) return next();
    res.status(500).json({ message: 'No config found' });
  }
}
