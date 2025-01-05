import { Controller, Get, Patch } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config, save_config } from '../utils/config';
import { IConfig } from '../utils/types';

@Controller('/config')
export class ConfigController {
  @Get()
  public get(_: Request, res: Response) {
    const config = load_config();
    return res.status(200).json(config);
  }

  @Patch({
    body: [{
      type: 'string',
      required: true,
      name: 'app_storage_path',
    }, {
      type: 'string',
      required: true,
      name: 'files_folder',
    }, {
      type: 'string',
      required: false,
      name: 'watch_dir',
    }, {
      type: 'array',
      required: true,
      name: 'folders',
      itemType: 'object',
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
    }, {
      type: 'string',
      required: true,
      name: 'tmdb_api_key',
    }, {
      type: 'string',
      required: true,
      name: 'tmdb_language',
    }, {
      type: 'boolean',
      required: false,
      name: 'hardware_acceleration',
    }, {
      type: 'boolean',
      required: false,
      name: 'save_images',
    }]
  })
  public patch(req: Request, res: Response) {
    const {
      app_storage_path,
      files_folder,
      watch_dir,
      folders,
      tmdb_api_key,
      tmdb_language,
      hardware_acceleration,
      save_images,
    } = req.body as Request['body'] & IConfig;

    try {
      save_config({
        app_storage_path,
        files_folder,
        watch_dir,
        folders,
        tmdb_api_key,
        tmdb_language,
        hardware_acceleration,
        save_images,
      });
      return res.status(200).json({ message: 'Config updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to update config' });
    }
  }
}
