import type { VoiceRequest, VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import type { Audio } from '../../domain/speech/Audio.ts';

/** A voice loaded only when the first line is generated (and once it loads): commands that make no voice never load it. */
export class LazyVoice implements VoiceProvider {
  readonly #load: () => Promise<VoiceProvider>;
  #voice: Promise<VoiceProvider> | undefined;

  constructor(load: () => Promise<VoiceProvider>) {
    this.#load = load;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    const voice = await this.#loaded();
    return voice.generate(request);
  }

  // A single load; if it fails, the next line tries again instead of inheriting the rejected promise.
  #loaded(): Promise<VoiceProvider> {
    this.#voice ??= this.#load().catch((error: unknown) => {
      this.#voice = undefined;
      throw error;
    });
    return this.#voice;
  }
}
