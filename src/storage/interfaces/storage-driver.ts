export interface StorageDriver {
  get(path: string): Promise<{ content: any; raw: any }>;
  put(path: string, content: any): Promise<{ raw: any }>;
}
