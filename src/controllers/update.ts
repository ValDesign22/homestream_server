import express from 'express';
import { Controller, HttpMethod, Route } from '../utils/route.js';
import { checkForUpdates, downloadAndApplyUpdate } from '../utils/updater.js';

class UpdateController extends Controller {
  @Route({
    path: '/update',
    method: HttpMethod.GET,
  })
  public async get(_: express.Request, res: express.Response) {
    const update = await checkForUpdates();
    return this.sendResponse(res, update);
  }

  @Route({
    path: '/update',
    method: HttpMethod.POST,
  })
  public async post(_: express.Request, res: express.Response) {
    const update = await checkForUpdates();
    if (!update.updateAvailable) return this.sendResponse(res, 'No updates available');
    if (!update.downloadUrl) return this.sendError(res, 'Failed to download update');
    else await downloadAndApplyUpdate(update.downloadUrl);
    return this.sendResponse(res, 'Update applied');
  }
}

export const updateController = new UpdateController();
