import { Request, Response } from "express";
import { load_config } from "../utils/config";
import { load_store } from "../utils/store";
import { IMovie, ITvShow } from "../utils/types";

const storesHandler = async (req: Request, res: Response) => {
  const config = load_config();

  const stores: Record<string, IMovie[] | ITvShow[]> = {};

  for (const folder of config.folders) stores[folder.name] = load_store(folder);

  res.status(200).send(stores);
};

export { storesHandler };
