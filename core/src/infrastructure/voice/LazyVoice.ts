import type { VoiceRequest, VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import type { Audio } from '../../domain/speech/Audio.ts';

/** A voice loaded only when the first line is generated (and once): commands that make no voice never load it. */
export class LazyVoice implements VoiceProvider {
  readonly #load: () => Promise<VoiceProvider>;
  #voice: Promise<VoiceProvider> | undefined;

  constructor(load: () => Promise<VoiceProvider>) {
    this.#load = load;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    this.#voice ??= this.#load();
    const voice = await this.#voice;
    return voice.generate(request);
  }
}
