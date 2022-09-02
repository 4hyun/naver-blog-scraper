import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { NaverBlogScraperModule } from '../naver-blog-scraper/naver-blog-scraper.module';
import { TOCTitleFactory } from './classes/TOCTitle';
import { ScraperService } from './scraper.service';

@Module({
  imports: [NaverBlogScraperModule, PuppeteerModule.forFeature()],
  providers: [ScraperService, TOCTitleFactory],
  exports: [ScraperService],
})
export class ScraperModule {}
