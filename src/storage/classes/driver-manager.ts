import { LocalFileSystem } from '../lib/drivers/LocalFileSystem';

export class DriverManager {
  /**
   * Default disk.
   */
  private defaultDisk: string | undefined;
  private readonly drivers: Record<string, any> = {
    local: LocalFileSystem,
  };
  constructor(config: any) {
    this.defaultDisk = config.default;
  }
  getDriver(disk: string, config: Record<string, any>) {
    const driver = this.drivers[config.driver];
    return new driver(disk, config);
  }
}
