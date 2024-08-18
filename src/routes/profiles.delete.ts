import { Request, Response } from 'express';

const profilesDelete = (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Missing required field: id' });

  res.status(200).json({ message: 'Profile deleted' });
};

export { profilesDelete };
