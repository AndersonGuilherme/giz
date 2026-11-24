import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { voiceFile, type VoiceStore, type RecordedVoice } from '../../application/ports/VoiceStore.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import { toWav } from '../voice/wav.ts';

const voiceRecordFile = (lineId: string) => `voice/${lineId}.json`;

function fileHash(path: string): string | undefined {
  try {
    return (JSON.parse(readFileSync(path, 'utf8')) as Partial<RecordedVoice>).hash;
  } catch {
    return undefined;
  }
}

/** Saves `voice/<id>.wav` and `voice/<id>.json` inside the project folder. */
export class DiskVoiceStore implements VoiceStore {
  readonly #folder: string;

  constructor(folder: string) {
    this.#folder = folder;
  }

  // Without the wav, the record does not count: the line is generated again.
  savedHash(lineId: string): string | undefined {
    if (!existsSync(join(this.#folder, voiceFile(lineId)))) return undefined;
    return fileHash(join(this.#folder, voiceRecordFile(lineId)));
  }

  async save(lineId: string, record: RecordedVoice, audio: Audio): Promise<void> {
    await mkdir(join(this.#folder, 'voice'), { recursive: true });
    await writeFile(join(this.#folder, voiceFile(lineId)), toWav(audio));
    await writeFile(join(this.#folder, voiceRecordFile(lineId)), JSON.stringify(record));
  }

  async read(lineId: string): Promise<RecordedVoice> {
    return JSON.parse(await readFile(join(this.#folder, voiceRecordFile(lineId)), 'utf8')) as RecordedVoice;
  }
}
