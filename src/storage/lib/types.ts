export type Response = { raw: unknown };

export interface FileListResponse extends Response {
  path: string;
}
