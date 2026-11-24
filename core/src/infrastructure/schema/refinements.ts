import { z } from 'zod';
import { DomainError } from '../../domain/DomainError.ts';
import { HexColor } from '../../domain/values/HexColor.ts';
import { CharacterId } from '../../domain/values/CharacterId.ts';

function errorMessage(error: unknown): string {
  if (!(error instanceof DomainError)) throw error;
  return error.message;
}

/** Runs the domain factory and returns the `DomainError` message, if any. */
export function domainMessage(factory: () => unknown): string | undefined {
  try {
    factory();
    return undefined;
  } catch (error) {
    return errorMessage(error);
  }
}

/** A text the domain factory accepts; the rejection message is the domain's own. */
export function validatedByDomain(factory: (text: string) => unknown) {
  return z.string().superRefine((text, context) => {
    const message = domainMessage(() => factory(text));
    if (message) context.addIssue({ code: 'custom', message: message });
  });
}

export const colorSchema = validatedByDomain((text) => HexColor.of(text));
export const characterIdSchema = validatedByDomain((text) => CharacterId.of(text));
export const nonEmptyText = z.string().min(1);
