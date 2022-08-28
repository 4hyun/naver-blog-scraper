import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BlogScraperExecutor } from 'src/scraper/interfaces';
import { lastValueFrom } from 'rxjs';

const NAVER_BLOG_URL = 'https://blog.naver.com/mindstay701';

@Injectable()
export class NaverBlogScraper implements BlogScraperExecutor {
  constructor(private readonly httpService: HttpService) {}
  async scrape() {
    const response = await lastValueFrom(this.httpService.get(NAVER_BLOG_URL));
    const $ = cheerio.load(response.data);
    const html = $.html();
    return html;
  }
}
