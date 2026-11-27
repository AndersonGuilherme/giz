import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { VoiceRequest, VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import { CostEstimate } from '../../domain/ai/CostEstimate.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import { fromWav } from './wav.ts';

/**
 * "I recorded this line myself": a line with its own take (`recordings/<lineId>.wav`) comes from it, whatever the
 * project voice; the other lines go to that voice. Like an uploaded scenario image, the person's own file wins.
 * Without any take, the fingerprint and the estimate are the inner voice's own, so no hash changes.
 */
export class OwnRecordingFirst implements VoiceProvider {
  readonly #voice: VoiceProvider;
  readonly #folder: string;

  constructor(voice: VoiceProvider, folder: string) {
    this.#voice = voice;
    this.#folder = folder;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    const take = this.#takeOf(request);
    if (!existsSync(take)) return this.#voice.generate(request);
    return fromWav(await readFile(take));
  }

  // A new take (its content changed), or a take added or removed, makes the line again.
  async fingerprint(request: VoiceRequest): Promise<string> {
    const take = this.#takeOf(request);
    if (!existsSync(take)) return (await this.#voice.fingerprint?.(request)) ?? '';
    return `recording:${createHash('sha1').update(await readFile(take)).digest('hex')}`;
  }

  estimate(request: VoiceRequest): CostEstimate {
    if (existsSync(this.#takeOf(request))) return CostEstimate.ZERO;
    return this.#voice.estimate?.(request) ?? CostEstimate.ZERO;
  }

  #takeOf(request: VoiceRequest): string {
    return join(this.#folder, 'recordings', `${request.lineId}.wav`);
  }
}
