import * as fse from 'fs-extra';
import * as path from 'path';
import { FileNotFound } from 'src/storage/exceptions/FileNotFound';
import { UnknownException } from 'src/storage/exceptions/UnknownException';
import { StorageDriver } from '../../interfaces/storage-driver';
import { isReadableStream } from '../utils';
import { pipeline } from 'node:stream/promises';
import { FileListResponse } from '../types';

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
    // console.log('DEBUG: ', fullPath);
    try {
      if (isReadableStream(content)) {
        const dir = path.dirname(location);
        await fse.ensureDir(dir);
        const writeStream = fse.createWriteStream(fullPath);
        await pipeline(content, writeStream);
        return { raw: undefined };
      }
      const result = await fse.outputFile(fullPath, content, {});
      return { raw: result };
    } catch (e) {
      throw handleError(e, location);
    }
  }

  /**
   * List files with a given prefix.
   */
  public flatList(prefix = ''): AsyncIterable<FileListResponse> {
    const fullPrefix = this.fullPath(prefix);
    return this._flatDirIterator(fullPrefix, prefix);
  }

  private async *_flatDirIterator(
    prefix: string,
    originalPrefix: string,
  ): AsyncIterable<FileListResponse> {
    const prefixDirectory =
      prefix[prefix.length - 1] === path.sep ? prefix : path.dirname(prefix);

    try {
      const dir = await fse.opendir(prefixDirectory);

      for await (const file of dir) {
        const fileName = path.join(prefixDirectory, file.name);
        if (fileName.startsWith(prefix)) {
          if (file.isDirectory()) {
            yield* this._flatDirIterator(
              path.join(fileName, path.sep),
              originalPrefix,
            );
          } else if (file.isFile()) {
            const pathValue = path.relative(this.rootDir, fileName);
            yield {
              raw: null,
              path: pathValue,
            };
          }
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw handleError(e, originalPrefix);
      }
    }
  }
}
