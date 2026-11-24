import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { VoiceRequest, VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import { fromWav } from './wav.ts';

/** "I recorded my voice": each line comes from `recordings/<lineId>.wav`, in the project folder. */
export class RecordingVoice implements VoiceProvider {
  readonly #folder: string;

  constructor(folder: string) {
    this.#folder = folder;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    const path = this.#pathOf(request);
    if (!existsSync(path)) throw new Error(`fala ${request.lineId}: gravação não encontrada; grave "${request.text}" em ${path}`);
    return fromWav(await readFile(path));
  }

  // A new take of the line (the file content changed) generates it again; without a recording there is none yet.
  async fingerprint(request: VoiceRequest): Promise<string> {
    const path = this.#pathOf(request);
    if (!existsSync(path)) return '';
    return createHash('sha1').update(await readFile(path)).digest('hex');
  }

  #pathOf(request: VoiceRequest): string {
    return join(this.#folder, 'recordings', `${request.lineId}.wav`);
  }
}
