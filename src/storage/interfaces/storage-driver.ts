export interface StorageDriver {
  get(path: string): Promise<Buffer | null>;
}
