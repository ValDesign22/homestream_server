import { Request, Response } from "express";
import { readdirSync, statSync } from "fs";
import { join } from "path";

interface IFolderItem {
  name: string;
  path: string;
  children?: IFolderItem[];
}

const foldersHandler = async (req: Request, res: Response) => {
  const FILES_FOLDER = process.env.FILES_FOLDER;
  if (!FILES_FOLDER) return res.status(500).send("Files folder not set");

  const stack: IFolderItem[] = [{
    name: FILES_FOLDER.split('/').pop() || '',
    path: FILES_FOLDER,
    children: []
  }];
  const root = stack[0];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    const dirItems = readdirSync(current.path);

    for (const item of dirItems) {
      const itemPath = join(current.path, item);
      const itemStat = statSync(itemPath);

      if (itemStat.isDirectory()) {
        const folder: IFolderItem = {
          name: item,
          path: itemPath,
          children: []
        };
        current.children?.push(folder);
        stack.push(folder);
      }
    }
  }

  res.status(200).json(root.children);
};

export { foldersHandler };