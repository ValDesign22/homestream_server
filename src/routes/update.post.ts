import { Request, Response } from "express";
import { checkForUpdates, downloadAndApplyUpdate } from "../utils/updater";

const updatePostHandler = async (req: Request, res: Response) => {
  const updater = await checkForUpdates();
  if (!updater.updateAvailable) return res.status(204).json({ message: "No updates available" });
  if (!updater.downloadUrl) return res.status(500).json({ message: "Failed to download update" });
  else await downloadAndApplyUpdate(updater.downloadUrl);
  res.status(200).json({ message: "Update applied" });
};

export { updatePostHandler };
