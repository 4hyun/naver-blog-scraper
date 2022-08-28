import { Inject, Injectable } from '@nestjs/common';
import { BlogScraperExecutor } from './interfaces';

@Injectable()
export class ScraperService {
  constructor(
    @Inject('BlogScraper')
    private readonly blogScraperExecutor: BlogScraperExecutor,
  ) {}

  async scrapeBlog() {
    return this.blogScraperExecutor.scrape();
  }
}
