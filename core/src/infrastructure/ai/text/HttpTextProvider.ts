import type { KeyStore } from '../../../application/ports/KeyStore.ts';
import type { TextAnswer, TextProvider, TextRequest } from '../../../application/ports/TextProvider.ts';
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
    return textCostEstimate(this.#api.provider, this.#model, request);
  }

  async generate(request: TextRequest): Promise<TextAnswer> {
    const { fetch, keys, wait, send = sendWithRetries } = this.#dependencies;
    const key = requiredKey(keys, this.#api.provider); // before sending: a missing key is not a failure to retry
    const { url, init } = this.#api.call(this.#model, request, key);
    const context: FailureContext = { label: this.#api.label, model: this.#model, key };
    const response = await send(this.#api.label, () => fetch(url, init), wait).catch((error: unknown) => {
      throw readableFailure(error, context);
    });
    return parsed(response, this.#api);
  }
}
