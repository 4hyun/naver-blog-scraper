import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Operation } from './operation/interfaces';
import { TestDataService } from './test-data.service';

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
}
