import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { VoiceProviderName } from '../../domain/project/Project.ts';
import { Lexicon } from '../../domain/speech/Lexicon.ts';
import type { ProblemCollector } from '../schema/errorMessages.ts';
import { nonEmptyText } from '../schema/refinements.ts';
import { readValidated } from './fileReading.ts';

const lexiconSchema = z.record(nonEmptyText, z.string());

// One dictionary per voice service, in the project folder: the spellings made for Qwen ("gê pê tê") confuse voices
// that already read English names. Recordings have none (the person reads the script).
const FILES: Readonly<Record<VoiceProviderName, string | undefined>> = {
  qwen: 'pronunciation.json',
  elevenlabs: 'pronunciation.elevenlabs.json',
  fish: 'pronunciation.fish.json',
  recording: undefined,
};

const exists = (path: string) => access(path).then(() => true, () => false);

/** The dictionary of the project voice service; without the file, the voice reads the text as it is. */
export async function readLexicon(folder: string, provider: VoiceProviderName, collector: ProblemCollector): Promise<Lexicon> {
  const file = FILES[provider];
  if (!file || !(await exists(join(folder, file)))) return Lexicon.EMPTY;
  const spellings = await readValidated({ folder, file, collector }, lexiconSchema);
  return spellings ? Lexicon.of(spellings) : Lexicon.EMPTY;
}
