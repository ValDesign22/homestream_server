import { Controller, Get, Post } from '@nuxum/core';
import { Request, Response } from 'express';
import { checkForUpdates, downloadAndApplyUpdate } from '../utils/updater';

@Controller('/update')
export class UpdateController {
  @Get()
  public async get(_: Request, res: Response) {
    const update = await checkForUpdates();
    return res.status(200).json(update);
  }

  @Post()
  public async post(_: Request, res: Response) {
    const update = await checkForUpdates();
    if (!update.updateAvailable || !update.downloadUrl) return res.status(200).json({ message: 'No updates available or failed to download update' });
    else await downloadAndApplyUpdate(update.downloadUrl);
    return res.status(200).json({ message: 'Update applied' });
  }
}
