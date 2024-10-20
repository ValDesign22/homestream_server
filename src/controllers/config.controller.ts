import { Controller, Get, Patch } from '@nuxum/core';
import express from 'express';
import { load_config, save_config } from '../utils/config.js';
import { IConfig } from '../utils/types.js';

@Controller('/config')
export class ConfigController {
  @Get()
  public get(_: express.Request, res: express.Response) {
    const config = load_config();
    return res.status(200).json(config);
  }

  @Patch({
    body: [{
      type: 'array',
      required: true,
      name: 'folders',
      nested: [{
        type: 'object',
        required: true,
        name: 'folder',
        nested: [{
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
    }]
  })
  public patch(req: express.Request, res: express.Response) {
    const { folders, tmdb_language } = req.body as express.Request['body'] & IConfig;

    try {
      save_config({ folders, tmdb_language });
      return res.status(200).json({ message: 'Config updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to update config' });
    }
  }
}
