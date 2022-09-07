import { Controller, Get, Post, Query, Body, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Operation } from './operation/interfaces';
import { TestDataService } from './test-data.service';
import * as path from 'path';
import { Response } from 'express';
import { StorageService } from './storage/storage.service';

type SepType = 'windows' | 'posix';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly testDataService: TestDataService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/action/scrape')
  async scrapeBlog(): Promise<Operation<{ id: string; data?: string }>> {
    let done = false;
    let data;
    await this.appService.scrapeBlog().then((d) => {
      done = true;
      data = d;
    });

    return {
      id: 'some-LRO-id',
      ...(done ? { done, reuslt: data.result } : { done }),
    };
  }

  @Get('db-connection-test')
  async getTestData() {
    /*     const result = await this.testDataService.getTestData();
    console.log('result: ', result); */
    const result = await this.testDataService.getTestData();
    return { data: result };
  }

  @Get('test-get-files-by-prefix')
  async testGetFilesByPrefix(
    @Query('prefix') prefix: string,
    @Query('sep') sep: SepType = 'posix',
  ) {
    const isPosixSystem = path.sep === '/';
    let filenames = [];
    for await (const filename of this.appService.testGetFilesByPrefix(prefix)) {
      filenames.push(filename);
    }
    if (sep !== 'posix' && isPosixSystem) {
      filenames = filenames.map((name) => {
        const pathValue = name.path.split(path.sep).join(path.win32.sep);
        return { ...name, path: pathValue };
      });
    }
    if (sep === 'posix' && !isPosixSystem) {
      filenames = filenames.map((name) => {
        const pathValue = name.path.split(path.sep).join(path.posix.sep);
        return { ...name, path: pathValue };
      });
    }
    return { filenames, count: filenames.length };
  }

  @Post('initialize-new-fields-on-scraped-posts')
  async initializeNewFieldsOnScrapedPosts(
    @Body() body: any,
    @Query('dry_run') dryRun: boolean = true,
    @Res() res: Response,
  ) {
    if (Object.keys(body).length === 0) {
      res.status(400).send({ message: 'Field object is empty.' });
    }

    const newFields = {};
    for (const field in body) {
      newFields[field] = body[field];
    }

    const filePaths = [];
    for await (const filename of this.appService.testGetFilesByPrefix(
      '/scraped/post-',
    )) {
      filePaths.push(filename);
    }

    const fileNames = filePaths.map(({ path: p }) =>
      p.split(path.sep).join(path.posix.sep),
    );

    const disk = this.storageService.getDisk('local');
    const files = await Promise.all(
      fileNames.map(async (filename) => await disk.get(filename)),
    );

    res.send({ files, count: files.length });
  }
}
