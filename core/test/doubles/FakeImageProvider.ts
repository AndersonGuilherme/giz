import type { GeneratedImage, ImageModel, ImageProvider, ImageRequest } from '../../src/application/ports/ImageProvider.ts';
import { CostEstimate } from '../../src/domain/ai/CostEstimate.ts';

/** A PNG header of the size (the pixels are never read): enough for imageSize and the aspect check. */
export function pngOfSize(width: number, height: number): Uint8Array {
  const header = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12);
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return new Uint8Array(header);
}

/** Answers every request with a PNG of the size asked for and keeps the requests; never calls a service. */
export class FakeImageProvider implements ImageProvider {
  readonly requests: ImageRequest[] = [];
  readonly #identity: ImageModel;

  constructor(identity: ImageModel = { provider: 'fal', model: 'fake-flux' }) {
    this.#identity = identity;
  }

  async generate(request: ImageRequest): Promise<GeneratedImage> {
    this.requests.push(request);
    return { bytes: pngOfSize(request.size.width, request.size.height), mime: 'image/png' };
  }

  /** Ten cents per image: easy to check. */
  estimate(): CostEstimate {
    return CostEstimate.ofDollars(0.1);
  }

  identity(): ImageModel {
    return this.#identity;
  }
}
