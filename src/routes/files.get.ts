import { Request, Response } from "express";
import { load_config } from "../utils/config";
import { EMediaType } from "../utils/types";
import { load_store } from "../utils/store";

const filesHandler = async (req: Request, res: Response) => {
  const config = load_config();

  const stores = [];

  for (const folder of config.folders) {
    const store = load_store(folder);
    stores.push(store);
  }
};

export { filesHandler };
