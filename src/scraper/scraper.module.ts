import { Module } from '@nestjs/common';
import { NaverBlogScraperModule } from '../naver-blog-scraper/naver-blog-scraper.module';
import { ScraperService } from './scraper.service';

@Module({
  imports: [NaverBlogScraperModule],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
