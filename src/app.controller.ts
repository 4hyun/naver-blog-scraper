import { Controller, Get, Post } from '@nestjs/common';
import cypress from 'cypress';
import { AppService } from './app.service';
import { Operation } from './operation/interfaces';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  async scrapeBlog(): Promise<Operation<{ id: string; data?: string }>> {
    let done = false;
    let data;
    await this.appService.scrapeBlog().then((d) => {
      done = true;
      data = d;
    });

    return { id: '111', ...(done ? { done, data } : data) };
  }
}
