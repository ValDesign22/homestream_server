import express from 'express';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'path';
import { Controller, HttpMethod, Route } from '../utils/route.js';

interface IFolderItem {
  id: number;
  name: string;
  path: string;
  children?: IFolderItem[];
}

class FoldersController extends Controller {
  @Route({
    path: '/folders',
    method: HttpMethod.GET,
  })
  public get(_: express.Request, res: express.Response) {
    const FILES_FOLDER = process.env.FILES_FOLDER;
    if (!FILES_FOLDER) return this.sendError(res, 'Files folder not set');

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
            id: this.getLastId(root) + 1,
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

    return this.sendResponse(res, root.children);
  }

  private getLastId(root: IFolderItem): number {
    let lastId = root.id;
    const stack = [root];

    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;

      if (current.id > lastId) lastId = current.id;
      if (current.children) stack.push(...current.children);
    }

    return lastId;
  }
}

export const foldersController = new FoldersController();
