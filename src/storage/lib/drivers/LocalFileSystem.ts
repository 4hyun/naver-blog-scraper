import * as fse from 'fs-extra';
import * as path from 'path';
import { FileNotFound } from 'src/storage/exceptions/FileNotFound';
import { UnknownException } from 'src/storage/exceptions/UnknownException';
import { StorageDriver } from '../../interfaces/storage-driver';
import { isReadableStream } from '../utils';
import { pipeline } from 'node:stream/promises';

const NOT_IMPLEMENTED_TEXT = 'Not implemented';

function handleError(
  err: Error & { code: string; path?: string },
  location: string,
): Error {
  switch (err.code) {
    case 'ENOENT':
      return new FileNotFound(err, location);
    /* case 'EPERM':
      return new PermissionMissing(err, location); */
    default:
      return new UnknownException(err, location);
  }
}

export class LocalFileSystem implements StorageDriver {
  private rootDir: string;

  constructor(config: Record<string, any>) {
    this.rootDir = path.resolve(config.root);
  }

  private fullPath(location: string): string {
    return path.join(this.rootDir, location);
  }

  async get(
    location: string,
    encoding = 'utf-8',
  ): Promise<{ content: any; raw: any }> {
    try {
      const result = await fse.readFile(this.fullPath(location), encoding);
      return { content: result, raw: result };
    } catch (e) {
      throw handleError(e, location);
    }
  }

  async put(
    location: string,
    content: Buffer | NodeJS.ReadableStream | string,
  ) {
    const fullPath = this.fullPath(location);
    try {
      if (isReadableStream(content)) {
        const dir = path.dirname(location);
        await fse.ensureDir(dir);
        const writeStream = fse.createWriteStream(fullPath);
        await pipeline(content, writeStream);
        return { raw: undefined };
      }
    } catch (e) {
      throw handleError(e, location);
    }
  }
}
