import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  exports: [StorageService],
  providers: [
    {
      provide: StorageService,
      useFactory: () => {
        return new StorageService({
          default: 'local',
          disks: { local: { root: process.cwd(), driver: 'local' } },
        });
      },
    },
  ],
})
export class StorageModule {}
