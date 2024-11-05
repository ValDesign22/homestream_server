import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'path';

interface IFolderItem {
  id: number;
  name: string;
  path: string;
  children?: IFolderItem[];
}

@Controller('/folders')
export class FoldersController {
  @Get()
  public get(_: Request, res: Response) {
    const FILES_FOLDER = process.env.FILES_FOLDER;
    if (!FILES_FOLDER) return res.status(500).json({ message: 'Files folder not set' });

    let lastId = 0;

    const createFolder = (name: string, path: string): IFolderItem => ({
      id: ++lastId,
      name,
      path,
      children: []
    });

    const root = createFolder(FILES_FOLDER.split('/').pop() || '', FILES_FOLDER);
    const stack: IFolderItem[] = [root];

    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;

      const items = readdirSync(current.path);

      for (const item of items) {
        const itemPath = join(current.path, item);
        const itemStat = statSync(itemPath);

        if (itemStat.isDirectory()) {
          const folder = createFolder(item, itemPath);
          current.children!.push(folder);
          stack.push(folder);
        }
      }

      if (current.children && current.children.length === 0) delete current.children;
    }

    return res.status(200).json(root.children);
  }
}
