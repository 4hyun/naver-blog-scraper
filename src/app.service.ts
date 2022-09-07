import { Injectable } from '@nestjs/common';
import { ScraperService } from './scraper/scraper.service';
import { StorageService } from './storage/storage.service';

const SCRAPED_POSTS_LOCATION = '/scraped';

@Injectable()
export class AppService {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly storageService: StorageService,
  ) {}
  getHello(): string {
    return 'Service is running';
  }

  async scrapeBlog() {
    return this.scraperService.scrapeBlog();
  }

  async addMetaToPosts() {
    const disk = this.storageService.getDisk('local');
    const files = await disk.get(SCRAPED_POSTS_LOCATION);
    return 'WIP';
  }

  testGetFilesByPrefix(prefix: string) {
    const disk = this.storageService.getDisk('local');
    return disk.flatList(prefix);
  }
}
