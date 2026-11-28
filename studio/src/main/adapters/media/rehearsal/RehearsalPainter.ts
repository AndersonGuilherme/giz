import type { GeneratedImage, ImageCallOptions, ImageModel, ImageProvider, ImageRequest } from 'gizzycera-core/src/application/ports/ImageProvider.ts';
import { fadedPng } from './solidPng.ts';

const PAUSE = 900;
// Dusk colors, a different pair for each prompt: two scenes never look the same.
const PALETTES = [
  { top: [58, 74, 110], bottom: [232, 150, 96] },
  { top: [36, 66, 58], bottom: [190, 214, 160] },
  { top: [92, 52, 96], bottom: [246, 196, 120] },
] as const;

// The pause ends early on a cancel, as a real call's fetch does (an AbortError).
const later = (milliseconds: number, signal: AbortSignal | undefined) => new Promise<void>((done, fail) => {
  const timer = setTimeout(done, milliseconds);
  signal?.addEventListener('abort', () => (clearTimeout(timer), fail(signal.reason)), { once: true });
});

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

  async generate(request: ImageRequest, { signal }: ImageCallOptions = {}): Promise<GeneratedImage> {
    this.calls += 1;
    signal?.throwIfAborted();
    await later(PAUSE, signal);
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
