import { Request, Response } from "express";
import { checkForUpdates } from "../utils/updater";

const updateHandler = async (req: Request, res: Response) => {
  const updater = await checkForUpdates();
  if (!updater) return res.status(204).json({ message: "No updates available" });
  res.status(200).json({ message: "Update applied" });
};

export { updateHandler };
