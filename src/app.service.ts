import { Injectable } from '@nestjs/common';
import { ScraperService } from './crawler/scraper.service';

@Injectable()
export class AppService {
  constructor(private readonly scraperService: ScraperService) {}
  getHello(): string {
    return 'Service is running';
  }

  async scrapeBlog() {
    return this.scraperService.scrapeBlog();
  }
}
