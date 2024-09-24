import express from 'express';
import { getProfiles, saveProfiles } from '../utils/profiles.js';
import { Controller, HttpMethod, Route } from '../utils/route.js';
import { IProfile } from '../utils/types.js';

class ProfilesController extends Controller {
  @Route({
    path: '/profiles',
    method: HttpMethod.GET,
  })
  public get(_: express.Request, res: express.Response) {
    const profiles = getProfiles();
    return this.sendResponse(res, profiles || []);
  }

  @Route({
    path: '/profiles',
    method: HttpMethod.PATCH,
    query: ['id'],
    body: ['updatedProfile'],
  })
  public patch(req: express.Request, res: express.Response) {
    const { id } = req.query;
    if (isNaN(parseInt(id as string, 10))) return this.sendError(res, 'Invalid profile id', 400);
    const { updatedProfile } = req.body as Request['body'] & { updatedProfile: IProfile };

    const profiles = getProfiles();
    if (!profiles) return this.sendError(res, 'Profiles not found', 404);
    if (!profiles.find((profile) => profile.id === parseInt(id as string, 10))) return this.sendError(res, 'Profile not found', 404);

    saveProfiles(profiles.map((profile) => (profile.id === parseInt(id as string, 10) ? updatedProfile : profile)));

    return this.sendResponse(res, { message: 'Profile updated successfully' });
  }

  @Route({
    path: '/profiles',
    method: HttpMethod.POST,
    body: ['newProfile'],
  })
  public post(req: express.Request, res: express.Response) {
    const newProfile = req.body as Request['body'] & { newProfile: IProfile };
    const profiles = getProfiles();
    if (!profiles) return this.sendError(res, 'Internal Server Error', 500);
    profiles.push(newProfile.newProfile);
    saveProfiles(profiles);
    return this.sendResponse(res, { message: 'Profile created' }, 201);
  }

  @Route({
    path: '/profiles',
    method: HttpMethod.DELETE,
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public delete(req: express.Request, res: express.Response) {
    const { id } = req.query;
    if (isNaN(parseInt(id as string, 10))) return this.sendError(res, 'Invalid id', 400);

    const profiles = getProfiles();
    if (!profiles) return this.sendError(res, 'Profiles not found', 404);

    saveProfiles(profiles.filter((profile) => profile.id !== parseInt(id as string, 10)));

    return this.sendResponse(res, { message: 'Profile deleted' });
  }
}

export const profilesController = new ProfilesController();
