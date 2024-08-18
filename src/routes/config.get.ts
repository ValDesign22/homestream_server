import { Request, Response } from 'express';
import { load_config } from '../utils/config';

const configGetHandler = (req: Request, res: Response) => {
  const config = load_config();
  res.status(200).send(config);
};

export { configGetHandler };
