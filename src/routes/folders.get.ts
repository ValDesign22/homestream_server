import { Request, Response } from "express";
import { readdirSync, statSync } from "fs";

interface IFolderItem {
  name: string;
  parent: string;
  path: string;
}

const foldersHandler = async (req: Request, res: Response) => {
  const FILES_FOLDER = process.env.FILES_FOLDER;
  if (!FILES_FOLDER) return res.status(500).send("Files folder not set");

  const stack = [FILES_FOLDER];
  const folders: IFolderItem[] = [];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const stat = statSync(current);

    if (stat.isFile()) continue;

    const dir = readdirSync(current);
    for (const item of dir) {
      const itemPath = `${current}/${item}`;
      const itemStat = statSync(itemPath);

      if (itemStat.isFile()) continue;

      folders.push({
        name: item,
        parent: current,
        path: itemPath,
      });

      if (itemStat.isDirectory()) stack.push(itemPath);
    }
  }

  res.status(200).send(folders);
};

export { foldersHandler };
