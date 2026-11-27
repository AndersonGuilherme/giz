import type { KeyStore } from '../../../application/ports/KeyStore.ts';
import type { GeneratedImage, ImageCallOptions, ImageModel, ImageProvider, ImageRequest } from '../../../application/ports/ImageProvider.ts';
import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import { imageCostEstimate } from '../../../domain/ai/imagePrices.ts';
import { sendWithRetries, ServiceHttpError, type SendPolicy, type Wait } from '../../http/serviceRequest.ts';
import { requiredKey } from '../../keys/requiredKey.ts';
import { readableFailure, type FailureContext } from '../text/textErrors.ts';
import type { ImageApi, ImageSource } from './imageApi.ts';
import {
  cappedBytes, checkedImage, checkedLink, checkedType, isRedirect, MAXIMUM_IMAGE_BYTES, MAXIMUM_REDIRECTS, RejectedImage, redirectTarget,
} from './imageDownload.ts';

/**
 * What an image provider needs from outside: the HTTP client, the keys, a timer, how to send (retries by default) and
 * the largest image it takes (`MAXIMUM_IMAGE_BYTES` by default).
 */
export type ImageDependencies = Readonly<{ fetch: typeof fetch; keys: KeyStore; wait: Wait; send?: SendPolicy; maximumBytes?: number }>;
type Link = Extract<ImageSource, { url: string }>;
/** The call's failure context and the person's cancel, carried through the download. */
type Call = FailureContext & Readonly<{ signal?: AbortSignal }>;
const withSignal = (init: RequestInit, signal: AbortSignal | undefined): RequestInit => (signal ? { ...init, signal } : init);

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

// The reason is the service's fault, not the person's: named after the service, never with the key or the link's path.
function rejected(error: unknown, label: string): never {
  if (error instanceof RejectedImage) throw new Error(`${label}: imagem recusada: ${error.message}`);
  throw error;
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

  async generate(request: ImageRequest, { signal }: ImageCallOptions = {}): Promise<GeneratedImage> {
    const { fetch, keys, wait, send = sendWithRetries } = this.#dependencies;
    const key = requiredKey(keys, this.#api.provider); // before sending: a missing key is not a failure to retry
    signal?.throwIfAborted();
    const { url, init } = this.#api.call(this.#model, request, key);
    const context: Call = { label: this.#api.label, model: this.#model, key, signal };
    const response = await send(this.#api.label, () => fetch(url, withSignal(init, signal)), wait).catch((error: unknown) => {
      signal?.throwIfAborted();
      throw readableFailure(error, context);
    });
    const source = await parsed(response, this.#api);
    return this.#checked(source, context).catch((error: unknown) => rejected(error, context.label));
  }

  // The declared type of an inline image is not trusted either: the bytes decide.
  async #checked(source: ImageSource, context: Call): Promise<GeneratedImage> {
    const maximum = this.#dependencies.maximumBytes ?? MAXIMUM_IMAGE_BYTES;
    const bytes = 'bytes' in source ? source.bytes : await this.#download(source, context, maximum);
    return checkedImage(bytes, maximum);
  }

  // Only from the service's own hosts over https, and fetched without the key; the type, size and bytes are checked.
  async #download(link: Link, context: Call, maximum: number): Promise<Uint8Array> {
    const hosts = this.#api.downloadHosts;
    const response = await this.#followed(checkedLink(link.url, hosts), context, 0);
    if (response.url) checkedLink(response.url, hosts); // a second check, should the client have followed on its own
    checkedType(response);
    return cappedBytes(response, maximum);
  }

  // Redirects are not followed blindly: each hop's Location goes through the same checks, at most MAXIMUM_REDIRECTS.
  async #followed(url: URL, context: Call, hops: number): Promise<Response> {
    const response = await this.#fetchOnce(url, context);
    const next = redirectTarget(response, url, this.#api.downloadHosts);
    if (!next) return response;
    if (hops >= MAXIMUM_REDIRECTS) throw new RejectedImage(`redirecionamentos demais (mais de ${MAXIMUM_REDIRECTS})`);
    return this.#followed(next, context, hops + 1);
  }

  // The send policy lets only 2xx through: a redirect is set aside, and the policy sees an empty success.
  async #fetchOnce(url: URL, context: Call): Promise<Response> {
    const { fetch, wait, send = sendWithRetries } = this.#dependencies;
    let redirect: Response | undefined;
    const response = await send(this.#api.label, async () => {
      const answer = await fetch(url.href, withSignal({ redirect: 'manual' }, context.signal));
      if (!isRedirect(answer.status)) return answer;
      redirect = answer;
      return new Response(null, { status: 204 });
    }, wait).catch((error: unknown) => {
      context.signal?.throwIfAborted();
      throw downloadFailure(error, context);
    });
    return redirect ?? response;
  }
}
