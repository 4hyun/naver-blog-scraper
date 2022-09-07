import { FileListResponse } from '../lib/types';

export interface StorageDriver {
  get(path: string): Promise<{ content: any; raw: any }>;
  put(path: string, content: any): Promise<{ raw: any }>;
  /**
   * List files with a given prefix.
   *
   * Supported drivers: "local", "s3", "gcs"
   */
  flatList(prefix?: string): AsyncIterable<FileListResponse>;
}
