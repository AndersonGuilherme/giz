import type { VoiceRequest, VoiceProvider } from '../../../application/ports/VoiceProvider.ts';
import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import { voiceCostEstimate } from '../../../domain/ai/voicePrices.ts';
import type { Audio } from '../../../domain/speech/Audio.ts';
import type { ExternalSettings } from './externalSettings.ts';
import { SERVICE_RATE, serviceAudio, type ServiceDependencies } from './serviceRequest.ts';

const API = 'https://api.fish.audio/v1/tts';

/** Fish Audio (paid): the cast `voice.id` is the Fish reference voice id. */
export class FishVoice implements VoiceProvider {
  readonly #dependencies: ServiceDependencies;
  readonly #settings: ExternalSettings;

  constructor(dependencies: ServiceDependencies, settings: ExternalSettings) {
    this.#dependencies = dependencies;
    this.#settings = settings;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    const { fetch, key, wait } = this.#dependencies;
    const apiKey = key(); // read once, before sending: a missing key is not a network failure to retry
    const body = JSON.stringify({ text: request.text, reference_id: request.voice, format: 'pcm', sample_rate: SERVICE_RATE });
    const send = () => fetch(API, {
      method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', model: this.#settings.fishModel }, body,
    });
    return serviceAudio('fish', send, wait);
  }

  // The model changes the audio: changing it generates the lines again.
  async fingerprint(): Promise<string> {
    return JSON.stringify([this.#settings.fishModel]);
  }

  // What the service bills: the text as sent, at the price of the model.
  estimate(request: VoiceRequest): CostEstimate {
    return voiceCostEstimate('fish', this.#settings.fishModel, request.text);
  }
}
