import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NaverBlogScraper } from './lib/naver-blog-scraper';

@Module({
  imports: [HttpModule],
  providers: [{ provide: 'BlogScraper', useClass: NaverBlogScraper }],
  exports: ['BlogScraper'],
})
export class NaverBlogScraperModule {}
