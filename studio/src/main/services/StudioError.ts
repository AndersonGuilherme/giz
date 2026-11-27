import type { FailureCode } from '../../shared/contract.ts';

const isList = (value: unknown): value is readonly string[] => Array.isArray(value);

/** An error the services throw on purpose: its code, message and details reach the window as they are. */
export class StudioError extends Error {
  readonly code: FailureCode;
  readonly details: readonly string[];
  /** A file or folder the failure left for the person (the draft of a failed script generation). */
  readonly path: string | undefined;

  /** `more`: the details, or the details and the path the failure left. */
  constructor(code: FailureCode, message: string, more: readonly string[] | Readonly<{ details: readonly string[]; path?: string }> = []) {
    super(message);
    const { details, path } = isList(more) ? { details: more, path: undefined } : more;
    this.name = 'StudioError';
    this.code = code;
    this.details = details;
    this.path = path;
  }
}
