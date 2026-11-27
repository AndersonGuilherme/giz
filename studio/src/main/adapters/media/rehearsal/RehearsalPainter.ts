import type { GeneratedImage, ImageModel, ImageProvider, ImageRequest } from 'giz-core/src/application/ports/ImageProvider.ts';
import { fadedPng } from './solidPng.ts';

const PAUSE = 900;
// Dusk colors, a different pair for each prompt: two scenes never look the same.
const PALETTES = [
  { top: [58, 74, 110], bottom: [232, 150, 96] },
  { top: [36, 66, 58], bottom: [190, 214, 160] },
  { top: [92, 52, 96], bottom: [246, 196, 120] },
] as const;

const later = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

/**
 * The pretend image AI of rehearsal mode: no network, no key. It answers a real PNG of the size asked for after a
 * moment (so progress and cancel can be seen), and keeps the real service's identity and price, so the stages and
 * the estimate are the ones the real service would give.
 */
export class RehearsalPainter implements ImageProvider {
  readonly #real: ImageProvider;
  calls = 0;

  constructor(real: ImageProvider) {
    this.#real = real;
  }

  async generate(request: ImageRequest): Promise<GeneratedImage> {
    this.calls += 1;
    await later(PAUSE);
    const palette = PALETTES[request.prompt.length % PALETTES.length]!;
    return { bytes: fadedPng(request.size, palette), mime: 'image/png' };
  }

  estimate(request: ImageRequest) {
    return this.#real.estimate(request);
  }

  identity(): ImageModel {
    return this.#real.identity();
  }
}
