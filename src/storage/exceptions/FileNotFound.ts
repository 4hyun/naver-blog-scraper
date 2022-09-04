import { RuntimeException } from 'node-exceptions';

export class FileNotFound extends RuntimeException {
  raw: Error;
  constructor(error: Error, location: string) {
    super(
      `The file '${location}' could not be found.`,
      500,
      'E_FILE_NOT_FOUND',
    );
    this.raw = error;
  }
}
