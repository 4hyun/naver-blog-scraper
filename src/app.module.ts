import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './scraper/scraper.module';

@Module({
  imports: [ScraperModule, PuppeteerModule.forRoot({ pipe: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
