import type { VoiceRequest, VoiceProvider } from '../../src/application/ports/VoiceProvider.ts';
import { Audio } from '../../src/domain/speech/Audio.ts';

const RATE = 24000;

/** Silence, a quiet start (below the envelope voice threshold), a tone, a quiet end and silence. */
function line(toneSeconds: number): Float32Array {
  const spans = [
    { seconds: 0.3, amplitude: 0 },
    { seconds: 0.2, amplitude: 0.015 },
    { seconds: toneSeconds, amplitude: 0.5 },
    { seconds: 0.2, amplitude: 0.015 },
    { seconds: 0.3, amplitude: 0 },
  ];
  const samples = spans.flatMap(({ seconds, amplitude }) =>
    Array.from({ length: Math.round(seconds * RATE) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / RATE)),
  );
  return Float32Array.from(samples);
}

export class FakeVoice implements VoiceProvider {
  calls = 0;
  readonly requests: VoiceRequest[] = [];
  /** What the source gives per line beyond the request (a recording take); none by default. */
  fingerprints: Record<string, string> = {};

  async generate(request: VoiceRequest): Promise<Audio> {
    this.calls++;
    this.requests.push(request);
    return Audio.of(line(0.05 * request.text.length), RATE);
  }

  async fingerprint(request: VoiceRequest): Promise<string> {
    return this.fingerprints[request.lineId] ?? '';
  }
}
