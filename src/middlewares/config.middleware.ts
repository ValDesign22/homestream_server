import { Injectable, NuxumMiddleware } from "@nuxum/core";
import { NextFunction, Request, Response } from "express";
import { load_config } from "../utils/config";

@Injectable()
export class ConfigMiddleware implements NuxumMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const config = load_config();
    if (!config && req.path !== '/config') return res.status(500).json({ message: 'No config found' });
    next();
  }
}
