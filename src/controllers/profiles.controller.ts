import { Controller, Delete, Get, Patch, Post } from '@nuxum/core';
import { Request, Response } from 'express';
import { getProfiles, saveProfiles } from '../utils/profiles';
import { IProfile } from '../utils/types';

@Controller('/profiles')
export class ProfilesController {
  @Get()
  public get(_: Request, res: Response) {
    const profiles = getProfiles();
    return res.status(200).json(profiles || []);
  }

  @Patch({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
    body: ['updatedProfile'],
  })
  public patch(req: Request, res: Response) {
    const { id } = req.query;
    if (isNaN(parseInt(id as string, 10))) return res.status(400).json({ message: 'Invalid profile id' });
    const { updatedProfile } = req.body as Request['body'] & { updatedProfile: IProfile };

    const profiles = getProfiles();
    if (!profiles) return res.status(404).json({ message: 'Profiles not found' });
    if (!profiles.find((profile) => profile.id === parseInt(id as string, 10))) return res.status(404).json({ message: 'Profile not found' });

    saveProfiles(profiles.map((profile) => (profile.id === parseInt(id as string, 10) ? updatedProfile : profile)));

    return res.status(200).json({ message: 'Profile updated successfully' });
  }

  @Post({
    body: ['newProfile'],
  })
  public post(req: Request, res: Response) {
    const newProfile = req.body as Request['body'] & { newProfile: IProfile };
    const profiles = getProfiles();
    if (!profiles) return res.status(500).json({ message: 'Internal Server Error' });
    profiles.push(newProfile.newProfile);
    saveProfiles(profiles);
    return res.status(201).json({ message: 'Profile created' });
  }

  @Delete({
    query: [{
      type: 'number',
      required: true,
      name: 'id',
    }],
  })
  public delete(req: Request, res: Response) {
    const { id } = req.query;
    if (isNaN(parseInt(id as string, 10))) return res.status(400).json({ message: 'Invalid id' });

    const profiles = getProfiles();
    if (!profiles) return res.status(404).json({ message: 'Profiles not found' });

    saveProfiles(profiles.filter((profile) => profile.id !== parseInt(id as string, 10)));

    return res.status(200).json({ message: 'Profile deleted' });
  }
}
