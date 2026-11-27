import type { FailureCode } from '../../shared/contract.ts';

/** An error the services throw on purpose: its code, message and details reach the window as they are. */
export class StudioError extends Error {
  readonly code: FailureCode;
  readonly details: readonly string[];

  constructor(code: FailureCode, message: string, details: readonly string[] = []) {
    super(message);
    this.name = 'StudioError';
    this.code = code;
    this.details = details;
  }
}
