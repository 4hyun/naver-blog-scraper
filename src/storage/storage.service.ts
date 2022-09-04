import { Injectable } from '@nestjs/common';
import { DriverManager } from './classes/driver-manager';
import { StorageDriver } from './interfaces/storage-driver';
import { StorageOptions } from './interfaces/storage-options';

@Injectable()
export class StorageService {
  private options: StorageOptions;
  private diskDrivers: { [key: string]: any };
  private driverManager: DriverManager;
  constructor(config: any) {
    this.options = { disks: {} };
    this.diskDrivers = {};
    this.driverManager = new DriverManager(config);
  }

  registerDriver(disk, driver) {
    this.diskDrivers[disk] = driver;
  }

  getDisk(disk: string): StorageDriver {
    if (disk in this.diskDrivers) return this.diskDrivers[disk];

    const driver = this.newDriver(disk);
    this.registerDriver(disk, driver);
    return driver;
  }

  newDriver(disk: string): StorageDriver {
    return this.driverManager.getDriver(disk, this.options.disks[disk]);
  }
}
