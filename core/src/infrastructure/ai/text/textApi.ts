import type { TextAnswer, TextRequest } from '../../../application/ports/TextProvider.ts';
import { DEFAULT_MAX_OUTPUT_TOKENS } from '../../../domain/ai/textPrices.ts';
import type { TextProviderName } from '../../../domain/ai/TextProviderName.ts';

/** The HTTP request of one call: the URL and the fetch options (method, headers with the key, JSON body). */
export type HttpCall = Readonly<{ url: string; init: RequestInit }>;

/** What differs between the text APIs: the request shape and how to read the answer; the rest is HttpTextProvider. */
export type TextApi = Readonly<{
  provider: TextProviderName;
  /** The name people know, for the messages. */
  label: string;
  defaultModel: string;
  call(model: string, request: TextRequest, key: string): HttpCall;
  /** Reads the parsed JSON answer; throws when it is not the expected shape. */
  answer(body: unknown): TextAnswer;
}>;

// Sent to the model, not shown to the person: so it is English, like the code.
const JSON_INSTRUCTION = 'Answer with a single valid JSON object only: no text before or after it and no code fences.';

/** The system instructions; in JSON mode they also ask for JSON (OpenAI's JSON mode requires it; others need it). */
export function systemOf(request: TextRequest): string {
  return request.json ? `${request.system}\n\n${JSON_INSTRUCTION}` : request.system;
}

export const maxTokensOf = (request: TextRequest): number => request.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

export function jsonPost(url: string, headers: Readonly<Record<string, string>>, body: unknown): HttpCall {
  return { url, init: { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(body) } };
}
