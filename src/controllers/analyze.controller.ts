import { Controller, Get } from '@nuxum/core';
import { Request, Response } from 'express';
import { load_config } from '../services/config.service';
import { analyze_library } from '../services/library.service';

@Controller('/analyze')
export class AnalyzeController {
  @Get()
  public async get(_: Request, res: Response) {
    const config = load_config()!;

    for (const folder of config.folders) {
      console.log(`Analyzing library ${folder.name}...`);
      await analyze_library(folder, config);
      console.log(`Library ${folder.name} analyzed`);
    }

    return res.status(200).json({ message: 'Analysis completed successfully' });
  }
}
