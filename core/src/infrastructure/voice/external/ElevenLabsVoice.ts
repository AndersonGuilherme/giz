import type { VoiceRequest, VoiceProvider } from '../../../application/ports/VoiceProvider.ts';
import type { Audio } from '../../../domain/speech/Audio.ts';
import type { ExternalSettings } from './externalSettings.ts';
import { withPauses } from './sentencePauses.ts';
import { SERVICE_RATE, serviceAudio, type ServiceDependencies } from './serviceRequest.ts';

const API = 'https://api.elevenlabs.io/v1/text-to-speech';

/** ElevenLabs (paid): the cast `voice.id` is the ElevenLabs voice id; the sentence ends get explicit pauses. */
export class ElevenLabsVoice implements VoiceProvider {
  readonly #dependencies: ServiceDependencies;
  readonly #settings: ExternalSettings;

  constructor(dependencies: ServiceDependencies, settings: ExternalSettings) {
    this.#dependencies = dependencies;
    this.#settings = settings;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    const { fetch, key, wait } = this.#dependencies;
    const apiKey = key(); // read once, before sending: a missing key is not a network failure to retry
    const body = JSON.stringify({ text: withPauses(request.text, this.#settings.pauses), model_id: this.#settings.elevenLabsModel });
    const send = () => fetch(`${API}/${request.voice}?output_format=pcm_${SERVICE_RATE}`, {
      method: 'POST', headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' }, body,
    });
    return serviceAudio('elevenlabs', send, wait);
  }

  // The model and the pauses change the audio: changing them generates the lines again.
  async fingerprint(): Promise<string> {
    return JSON.stringify([this.#settings.elevenLabsModel, this.#settings.pauses]);
  }
}
