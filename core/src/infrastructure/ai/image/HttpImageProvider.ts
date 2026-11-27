import type { KeyStore } from '../../../application/ports/KeyStore.ts';
import type { GeneratedImage, ImageModel, ImageProvider, ImageRequest } from '../../../application/ports/ImageProvider.ts';
import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import { imageCostEstimate } from '../../../domain/ai/imagePrices.ts';
import { sendWithRetries, ServiceHttpError, type SendPolicy, type Wait } from '../../http/serviceRequest.ts';
import { requiredKey } from '../../keys/requiredKey.ts';
import { readableFailure, type FailureContext } from '../text/textErrors.ts';
import type { ImageApi, ImageSource } from './imageApi.ts';

/** What an image provider needs from outside: the HTTP client, the keys, a timer and how to send (retries by default). */
export type ImageDependencies = Readonly<{ fetch: typeof fetch; keys: KeyStore; wait: Wait; send?: SendPolicy }>;
type Link = Extract<ImageSource, { url: string }>;

const NO_IMAGE = 'o serviço não devolveu imagem (o pedido pode ter sido recusado pelos filtros de conteúdo: mude o prompt e tente de novo)';

async function parsed(response: Response, api: ImageApi): Promise<ImageSource> {
  let source: ImageSource | undefined;
  try {
    source = api.image(await response.json());
  } catch {
    throw new Error(`${api.label}: resposta inesperada do serviço`);
  }
  if (!source) throw new Error(`${api.label}: ${NO_IMAGE}`);
  return source;
}

function downloadFailure(error: unknown, context: FailureContext): Error {
  if (error instanceof ServiceHttpError) return new Error(`${context.label}: não foi possível baixar a imagem (${error.status})`);
  return readableFailure(error, context);
}

/** An image AI over HTTP: one API shape (OpenAI, Gemini, fal.ai), the shared retries and the readable errors. */
export class HttpImageProvider implements ImageProvider {
  readonly #api: ImageApi;
  readonly #dependencies: ImageDependencies;
  readonly #model: string;

  constructor(api: ImageApi, dependencies: ImageDependencies, model: string = api.defaultModel) {
    this.#api = api;
    this.#dependencies = dependencies;
    this.#model = model;
  }

  identity(): ImageModel {
    return { provider: this.#api.provider, model: this.#model };
  }

  estimate(request: ImageRequest): CostEstimate {
    return imageCostEstimate(this.#api.provider, this.#model, request.size);
  }

  async generate(request: ImageRequest): Promise<GeneratedImage> {
    const { fetch, keys, wait, send = sendWithRetries } = this.#dependencies;
    const key = requiredKey(keys, this.#api.provider); // before sending: a missing key is not a failure to retry
    const { url, init } = this.#api.call(this.#model, request, key);
    const context: FailureContext = { label: this.#api.label, model: this.#model, key };
    const response = await send(this.#api.label, () => fetch(url, init), wait).catch((error: unknown) => {
      throw readableFailure(error, context);
    });
    const source = await parsed(response, this.#api);
    return 'bytes' in source ? source : this.#download(source, context);
  }

  // The link is public (fal's storage): it is fetched without the key.
  async #download(link: Link, context: FailureContext): Promise<GeneratedImage> {
    const { fetch, wait, send = sendWithRetries } = this.#dependencies;
    const response = await send(this.#api.label, () => fetch(link.url), wait).catch((error: unknown) => {
      throw downloadFailure(error, context);
    });
    const mime = link.mime ?? response.headers.get('content-type') ?? 'image/png';
    return { bytes: new Uint8Array(await response.arrayBuffer()), mime };
  }
}
