import { Request, Response } from "express";
import { readdirSync, statSync } from "fs";
import { join } from "path";

interface IFolderItem {
  id: number;
  name: string;
  path: string;
  children?: IFolderItem[];
}

const getLastId = (root: IFolderItem): number => {
  let lastId = root.id;
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    if (current.id > lastId) lastId = current.id;
    if (current.children) stack.push(...current.children);
  }

  return lastId;
};

const foldersHandler = async (req: Request, res: Response) => {
  const FILES_FOLDER = process.env.FILES_FOLDER;
  if (!FILES_FOLDER) return res.status(500).send("Files folder not set");

  const stack: IFolderItem[] = [{
    id: 0,
    name: FILES_FOLDER.split('/').pop() || '',
    path: FILES_FOLDER,
    children: []
  }];
  const root = stack[0];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    const items = readdirSync(current.path);

    for (const item of items) {
      const itemPath = join(current.path, item);
      const itemStat = statSync(itemPath);

      if (itemStat.isDirectory()) {
        const folder: IFolderItem = {
          id: getLastId(root) + 1,
          name: item,
          path: itemPath,
          children: []
        };
        current.children?.push(folder);
        stack.push(folder);
      }
    }

    if (current.children && current.children.length === 0) delete current.children;
  }

  res.status(200).json(root.children);
};

export { foldersHandler };