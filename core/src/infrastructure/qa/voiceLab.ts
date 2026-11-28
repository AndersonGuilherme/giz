import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Audio } from '../../domain/speech/Audio.ts';
import { comparableWords, wordErrors } from '../../domain/speech/WordErrorRate.ts';
import type { Qwen3Tts } from '../voice/qwen/Qwen3Tts.ts';
import { QWEN_RATE } from '../voice/qwen/qwenModels.ts';
import { toWav } from '../voice/wav.ts';
import type { Transcriber } from './WhisperTranscriber.ts';

// The voice lab (`gizzy qa voices`): the same sentences with each Qwen3-TTS voice, and how many words the local
// Whisper understands (lower WER = clearer pt-BR), plus the generation time. Port of the motor's scripts/voice-lab.ts.
const SENTENCES = [
  'Três mil clientes receberam uma confirmação de compra, sem comprar absolutamente nada.',
  'Então como uma consulta de frete disparou três mil e-mails?',
  'Código funcionando não quer dizer código fácil de mudar.',
  'Você acha que dá pra resolver isso sem reescrever tudo?',
];

export type Lab = Readonly<{ tts: Pick<Qwen3Tts, 'generate' | 'availableSpeakers'>; transcriber: Transcriber; output: string }>;
type Options = Readonly<{ voices?: readonly string[]; instruct?: string }>;
type Take = Readonly<{ errors: number; words: number; seconds: number; generation: number; heard: string }>;

async function take(lab: Lab, voice: string, options: Readonly<{ index: number; instruct?: string }>): Promise<Take> {
  const sentence = SENTENCES[options.index];
  const started = performance.now();
  const audio = Audio.of(await lab.tts.generate(sentence, { speaker: voice, instruct: options.instruct, seed: 7 + options.index }), QWEN_RATE);
  const generation = (performance.now() - started) / 1000;
  const heard = await lab.transcriber.transcribe(audio, 'portuguese');
  await writeFile(join(lab.output, `${voice}-${options.index + 1}.wav`), toWav(audio));
  const { errors } = wordErrors(comparableWords(sentence), comparableWords(heard));
  return { errors, words: comparableWords(sentence).length, seconds: audio.duration().value(), generation, heard };
}

async function takesOf(lab: Lab, voice: string, instruct: string | undefined): Promise<Take[]> {
  const takes: Take[] = [];
  for (const index of SENTENCES.keys()) takes.push(await take(lab, voice, { index, instruct }));
  return takes;
}

function rowOf(voice: string, takes: readonly Take[]): string {
  const total = (field: 'errors' | 'words' | 'seconds' | 'generation') => takes.reduce((sum, one) => sum + one[field], 0);
  const rate = ((100 * total('errors')) / total('words')).toFixed(1).padStart(5);
  return `${voice.padEnd(9)} WER ${rate}%  ${total('seconds').toFixed(1)}s de áudio em ${total('generation').toFixed(0)}s  | ${takes.map((one) => one.heard).join(' | ')}`;
}

/** One row per voice; the WAVs go to `output/<voice>-<n>.wav`. */
export async function compareVoices(lab: Lab, options: Options, log: (row: string) => void): Promise<void> {
  await mkdir(lab.output, { recursive: true });
  for (const voice of options.voices ?? lab.tts.availableSpeakers()) log(rowOf(voice, await takesOf(lab, voice, options.instruct)));
}
