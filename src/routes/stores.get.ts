import { Request, Response } from "express";
import { load_config } from "../utils/config";
import { IFolder } from "../utils/types";
import { load_store } from "../utils/store";

const storesHandler = async (req: Request, res: Response) => {
  const config = load_config();

  const stores: Record<IFolder["name"], any> = {};

  for (const folder of config.folders) {
    stores[folder.name] = load_store(folder);
  }
};

export { storesHandler };
