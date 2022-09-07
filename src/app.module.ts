import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './scraper/scraper.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TestData, TestDataSchema } from './shared/schemas/test.schema';
import { TestDataService } from './test-data.service';

@Module({
  imports: [
    PuppeteerModule.forRoot({ pipe: true }),
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('MONGO_CONNECTION_DEV'),
          useNewUrlParser: true,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: TestData.name, schema: TestDataSchema },
    ]),
    ScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService, TestDataService],
})
export class AppModule {}
