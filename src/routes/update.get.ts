import { Request, Response } from "express";
import { checkForUpdates, downloadAndApplyUpdate } from "../utils/updater";

const updateGetHandler = async (req: Request, res: Response) => {
  const updater = await checkForUpdates();
  res.status(200).json({ ...updater });
};

export { updateGetHandler };
