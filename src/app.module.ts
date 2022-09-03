import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './scraper/scraper.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PuppeteerModule.forRoot({ pipe: true }),
    ConfigModule.forRoot(),
    ScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
