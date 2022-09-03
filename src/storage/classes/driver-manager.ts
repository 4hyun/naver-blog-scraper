import { Local } from '../lib/drivers/Local';

export class DriverManager {
  private readonly driverMap: Record<string, any> = {
    local: Local,
  };
  getDriver(disk: string, config: Record<string, any>) {
    const driver = this.driverMap[config.driver];
    return new driver(disk, config);
  }
}
