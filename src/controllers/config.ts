import express from 'express';
import { load_config, save_config } from '../utils/config.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';
import { IConfig } from '../utils/types.js';

class ConfigController extends Controller {
  @Route({
    path: '/config',
    method: HttpMethod.GET,
  })
  public get(_: express.Request, res: express.Response) {
    const config = load_config();
    return this.sendResponse(res, config);
  }

  @Route({
    path: '/config',
    method: HttpMethod.PATCH,
    body: [{
      type: 'array',
      required: true,
      name: 'folders',
      values: [{
        type: 'object',
        required: true,
        name: 'folder',
        keys: [{
          type: 'number',
          required: true,
          name: 'id',
        }, {
          type: 'string',
          required: true,
          name: 'name',
        }, {
          type: 'string',
          required: true,
          name: 'path',
        }, {
          type: 'number',
          required: true,
          name: 'media_type',
        }],
      }],
    }, {
      type: 'string',
      required: true,
      name: 'tmdb_language',
    }],
  })
  public patch(req: express.Request, res: express.Response) {
    const { folders, tmdb_language } = req.body as Request['body'] & IConfig;

    try {
      save_config({ folders, tmdb_language });
      return this.sendResponse(res, { message: 'Config updated successfully' });
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to update config', 500);
    }
  }
}

export const configController = new ConfigController();
