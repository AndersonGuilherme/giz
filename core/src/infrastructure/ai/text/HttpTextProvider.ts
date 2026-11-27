import type { KeyStore } from '../../../application/ports/KeyStore.ts';
import type { TextAnswer, TextCallOptions, TextProvider, TextRequest } from '../../../application/ports/TextProvider.ts';
import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import { textCostEstimate } from '../../../domain/ai/textPrices.ts';
import { sendWithRetries, type SendPolicy, type Wait } from '../../http/serviceRequest.ts';
import { requiredKey } from '../../keys/requiredKey.ts';
import type { TextApi } from './textApi.ts';
import { readableFailure, type FailureContext } from './textErrors.ts';

/**
 * What a text provider needs from outside: the HTTP client, the keys and a timer (all injected, for the tests), and
 * how to send (with the retries by default).
 */
export type TextDependencies = Readonly<{ fetch: typeof fetch; keys: KeyStore; wait: Wait; send?: SendPolicy }>;

// A request's cache hint goes only to an API that takes cache markers (the estimate follows what is sent).
function sendable(api: TextApi, request: TextRequest): TextRequest {
  if (api.promptCaching || request.stablePrefix === undefined) return request;
  return { ...request, stablePrefix: undefined };
}

async function parsed(response: Response, api: TextApi): Promise<TextAnswer> {
  try {
    return api.answer(await response.json());
  } catch {
    throw new Error(`${api.label}: resposta inesperada do serviço`);
  }
}

/** A text AI over HTTP: one API shape (Anthropic, OpenAI, Gemini), the shared retries and the readable errors. */
export class HttpTextProvider implements TextProvider {
  readonly #api: TextApi;
  readonly #dependencies: TextDependencies;
  readonly #model: string;

  constructor(api: TextApi, dependencies: TextDependencies, model: string = api.defaultModel) {
    this.#api = api;
    this.#dependencies = dependencies;
    this.#model = model;
  }

  model(): string {
    return this.#model;
  }

  estimate(request: TextRequest): CostEstimate {
    return textCostEstimate(this.#api.provider, this.#model, sendable(this.#api, request));
  }

  async generate(request: TextRequest, { signal }: TextCallOptions = {}): Promise<TextAnswer> {
    const { fetch, keys, wait, send = sendWithRetries } = this.#dependencies;
    const key = requiredKey(keys, this.#api.provider); // before sending: a missing key is not a failure to retry
    signal?.throwIfAborted();
    const { url, init } = this.#api.call(this.#model, sendable(this.#api, request), key);
    const context: FailureContext = { label: this.#api.label, model: this.#model, key };
    const sent = signal ? { ...init, signal } : init;
    const response = await send(this.#api.label, () => fetch(url, sent), wait).catch((error: unknown) => {
      signal?.throwIfAborted();
      throw readableFailure(error, context);
    });
    return parsed(response, this.#api);
  }
}
