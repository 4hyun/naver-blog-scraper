import { RuntimeException } from 'node-exceptions';

export class UnknownException extends RuntimeException {
  raw: Error;
  constructor(error: Error, location: string) {
    super(`Unknown error handling file ${location}`, 500, 'E_UNKNOWN');
    this.raw = error;
  }
}
