import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import * as cheerio from 'cheerio';
import { lastValueFrom } from 'rxjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NAVER_BLOG_URL } from './naver-blog-scraper/lib/naver-blog-scraper';
import { ScraperModule } from './scraper/scraper.module';

describe('AppController', () => {
  let appController: AppController;
  let httpService: HttpService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ScraperModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    httpService = await app.resolve<HttpService>(HttpService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('scrape blog', () => {
    it('should fetch blog document', async () => {
      const response = await lastValueFrom(httpService.get(NAVER_BLOG_URL));
      const $ = cheerio.load(response.data);
      const blogHomeHtml = $.html();
      const tableOfContentsHtml = $(
        'li[class*="parentcategoryno_-1"] > div[class*="tlink"]',
      );
      /*       console.log('tableOfContentsHtml', tableOfContentsHtml);
      console.log('tableOfContentsHtml.length', tableOfContentsHtml.length); */
      console.log('response.headers: ', response.headers);
    });
  });
});
