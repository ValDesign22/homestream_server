import { Controller, Get, Post } from '@nuxum/core';
import express from 'express';
import { checkForUpdates, downloadAndApplyUpdate } from '../utils/updater.js';

@Controller('/update')
export class UpdateController {
  @Get()
  public async get(_: express.Request, res: express.Response) {
    const update = await checkForUpdates();
    return res.status(200).json(update);
  }

  @Post()
  public async post(_: express.Request, res: express.Response) {
    const update = await checkForUpdates();
    if (!update.updateAvailable || !update.downloadUrl) return res.status(200).json({ message: 'No updates available or failed to download update' });
    else await downloadAndApplyUpdate(update.downloadUrl);
    return res.status(200).json({ message: 'Update applied' });
  }
}
