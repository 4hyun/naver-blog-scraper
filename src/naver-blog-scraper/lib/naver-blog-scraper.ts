import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BlogScraperExecutor } from '../../scraper/interfaces';
import { lastValueFrom } from 'rxjs';

export const NAVER_BLOG_URL = 'https://blog.naver.com/mindstay701';

@Injectable()
export class NaverBlogScraper implements BlogScraperExecutor {
  constructor(private readonly httpService: HttpService) {}
  async scrape() {
    const response = await lastValueFrom(this.httpService.get(NAVER_BLOG_URL));
    const $ = cheerio.load(response.data);
    const tableOfContents = this.getTableOfContents($);
    const html = $.html();
    console.log('TOC: ', tableOfContents);
    return { message: 'Testing' };
  }

  getTableOfContents($: cheerio.CheerioAPI) {
    return $('li[class*="parentcategoryno_-1"] > div[class*="tlink"]');
  }
}
