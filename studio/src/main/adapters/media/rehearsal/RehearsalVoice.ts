import type { VoiceProvider, VoiceRequest } from 'gizzycera-core/src/application/ports/VoiceProvider.ts';
import type { Audio } from 'gizzycera-core/src/domain/speech/Audio.ts';

const RATE = 24000;
const SECONDS_PER_LETTER = 0.055;
const PAUSE = 250;

// A hum that rises and falls once per syllable (about every three letters), with silence at both ends.
function hum(text: string): Float32Array {
  const voiced = Math.max(0.4, text.length * SECONDS_PER_LETTER) * RATE;
  const silence = 0.15 * RATE;
  return Float32Array.from({ length: Math.round(voiced + 2 * silence) }, (_unused, index) => {
    const at = index - silence;
    if (at < 0 || at > voiced) return 0;
    const syllable = Math.abs(Math.sin((Math.PI * at) / (RATE * 0.18)));
    return 0.45 * syllable * Math.sin((2 * Math.PI * 180 * index) / RATE);
  });
}

/**
 * The pretend voice of rehearsal mode: no model, no network. Like the local voice it is free and has no fingerprint,
 * so a line it made counts as current in the stages.
 */
export class RehearsalVoice implements VoiceProvider {
  readonly requests: VoiceRequest[] = [];

  async generate(request: VoiceRequest): Promise<Audio> {
    this.requests.push(request);
    await new Promise((done) => setTimeout(done, PAUSE));
    const { Audio } = await import('gizzycera-core/src/domain/speech/Audio.ts');
    return Audio.of(hum(request.text), RATE);
  }
}
