import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '#/services/config.service';
import { analyze_library } from '#/services/library';

@Controller('/analyze')
export class AnalyzeController {
  @Get({
    query: [
      {
        name: 'library',
        type: 'number',
        required: false,
      },
    ],
  })
  public async get(req: Request, res: Response) {
    const config = load_config()!;
    const library_id = req.query.library as string | undefined;

    for (const folder of config.folders) {
      if (library_id && folder.id !== parseInt(library_id)) continue;
      console.log(`Analyzing library ${folder.name}...`);
      await analyze_library(folder, config);
      console.log(`Library ${folder.name} analyzed`);
    }

    return res.status(200).json({ message: 'Analysis completed successfully' });
  }
}
