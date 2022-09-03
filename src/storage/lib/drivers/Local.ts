import { StorageDriver } from '../../../storage/interfaces/storage-driver';

const NOT_IMPLEMENTED_TEXT = 'Not implemented';

export class Local implements StorageDriver {
  async get() {
    console.log(NOT_IMPLEMENTED_TEXT);
    return Buffer.from(NOT_IMPLEMENTED_TEXT);
  }
}
