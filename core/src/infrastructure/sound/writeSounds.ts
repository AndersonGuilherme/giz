import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SOUND_RATE, synthesizedSounds } from '../../domain/sound/SynthesizedSounds.ts';
import { Audio } from '../../domain/speech/Audio.ts';
import { toWav } from '../voice/wav.ts';

/** `giz sounds`: writes `<folder>/<name>.wav` for each synthesized sound effect; returns the names. */
export async function writeSounds(folder: string): Promise<string[]> {
  await mkdir(folder, { recursive: true });
  const sounds = Object.entries(synthesizedSounds());
  for (const [name, samples] of sounds) await writeFile(join(folder, `${name}.wav`), toWav(Audio.of(samples, SOUND_RATE)));
  return sounds.map(([name]) => name);
}
