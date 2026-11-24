import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { voiceFile } from '../../application/ports/VoiceStore.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import { fromWav } from '../voice/wav.ts';

/** The generated voice of a line (`voice/<id>.wav`), or `undefined` when it has none yet. */
export async function lineAudio(folder: string, lineId: string): Promise<Audio | undefined> {
  const path = join(folder, voiceFile(lineId));
  if (!existsSync(path)) return undefined;
  return fromWav(await readFile(path));
}
