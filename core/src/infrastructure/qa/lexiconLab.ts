import { Audio } from '../../domain/speech/Audio.ts';
import { comparableWords } from '../../domain/speech/WordErrorRate.ts';
import type { Qwen3Tts } from '../voice/qwen/Qwen3Tts.ts';
import { QWEN_RATE } from '../voice/qwen/qwenModels.ts';
import type { Transcriber } from './WhisperTranscriber.ts';

// The pronunciation lab (`gizzy qa lexicon`): says each candidate spelling inside a sentence and asks Whisper what it
// heard. The winning spelling goes to the project pronunciation.json. Port of the motor's scripts/lexicon-lab.ts.
/** `frame` holds an X where the candidate goes: "Fiz o X ontem.". */
export type SpellingTest = Readonly<{ word: string; frame: string; candidates: readonly string[] }>;
export type LexiconLab = Readonly<{ tts: Pick<Qwen3Tts, 'generate'>; transcriber: Transcriber; voice: string }>;

export const DEFAULT_SPELLING_TESTS: readonly SpellingTest[] = [{ word: 'e-mails', frame: 'Chegaram três mil X hoje.', candidates: ['e-mails', 'iméios'] }];

async function tryCandidate(lab: LexiconLab, test: SpellingTest, candidate: string): Promise<string> {
  const samples = await lab.tts.generate(test.frame.replace('X', candidate), { speaker: lab.voice, seed: 7 });
  const heard = await lab.transcriber.transcribe(Audio.of(samples, QWEN_RATE), 'portuguese');
  const understood = comparableWords(heard).join('').includes(comparableWords(test.word).join(''));
  return `${understood ? '✔' : '✖'} ${candidate} → "${heard}"`;
}

/** For each test: the word, then one line per candidate (✔ when Whisper heard the word). */
async function tryAll(lab: LexiconLab, test: SpellingTest): Promise<string[]> {
  const results: string[] = [];
  for (const candidate of test.candidates) results.push(await tryCandidate(lab, test, candidate));
  return results;
}

export async function compareSpellings(lab: LexiconLab, tests: readonly SpellingTest[], log: (text: string) => void): Promise<void> {
  for (const test of tests) log(`\n${test.word}\n  ${(await tryAll(lab, test)).join('\n  ')}`);
}
