import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { StorageModule } from 'src/storage/storage.module';
import { NaverBlogScraperModule } from '../naver-blog-scraper/naver-blog-scraper.module';
import { TOCTitleFactory } from './classes/TOCTitle';
import { ScraperService } from './scraper.service';

@Module({
  imports: [
    NaverBlogScraperModule,
    PuppeteerModule.forFeature(),
    StorageModule,
  ],
  providers: [ScraperService, TOCTitleFactory],
  exports: [ScraperService],
})
export class ScraperModule {}
