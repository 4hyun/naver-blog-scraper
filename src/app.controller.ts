import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Operation } from './operation/interfaces';
import { TestDataService } from './test-data.service';
import * as path from 'path';

type SepType = 'windows' | 'posix';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly testDataService: TestDataService,
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
    let filenames = [];
    const isPosixSystem = path.sep === '/';
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
}
