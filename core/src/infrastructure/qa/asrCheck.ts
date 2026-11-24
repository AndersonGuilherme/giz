import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import { BeatText } from '../../domain/timeline/BeatText.ts';
import { comparableWords, wordErrors } from '../../domain/speech/WordErrorRate.ts';
import { WHISPER_LANGUAGES } from '../alignment/whisperModel.ts';
import type { Transcriber } from './WhisperTranscriber.ts';
import { lineAudio } from './lineAudio.ts';

// The automatic ear (`giz qa asr`): transcribes each line with Whisper and counts the words it gets wrong; the most
// missed words are candidates for the pronunciation dictionary. Port of the motor's scripts/asr-check.ts.
/** One heard line in output/asr.json (read by `giz qa asr-aggregate`). */
export type HeardLine = Readonly<{ line: string; reference: string; heard: string; errors: number; words: number }>;
type Check = Readonly<{ folder: string; project: Project; transcriber: Transcriber }>;
type Totals = { errors: number; words: number; questions: number; heardQuestions: number; missed: Map<string, number>; report: string[] };

async function heardLine(check: Check, line: Line): Promise<HeardLine | undefined> {
  const audio = await lineAudio(check.folder, line.id());
  if (!audio) return undefined;
  const heard = await check.transcriber.transcribe(audio, WHISPER_LANGUAGES[check.project.language().code()]);
  // The reference is the caption (the real text), not the phonetic spelling of the pronunciation.
  const reference = BeatText.of(line.text()).clean();
  const { errors } = wordErrors(comparableWords(reference), comparableWords(heard));
  return { line: line.id(), reference, heard, errors, words: comparableWords(reference).length };
}

// A question line counts as heard when Whisper also wrote a question mark.
function countQuestion(totals: Totals, heard: HeardLine): void {
  totals.questions++;
  if (heard.heard.endsWith('?')) totals.heardQuestions++;
  if (!heard.heard.endsWith('?')) totals.report.push(`${heard.line} PERGUNTA NÃO PERCEBIDA: "${heard.heard}"`);
}

function count(totals: Totals, { heard, line }: Readonly<{ heard: HeardLine; line: Line }>): void {
  totals.errors += heard.errors;
  totals.words += heard.words;
  wordErrors(comparableWords(heard.reference), comparableWords(heard.heard)).missed.forEach((word) => totals.missed.set(word, (totals.missed.get(word) ?? 0) + 1));
  if (heard.errors) totals.report.push(`${heard.line} (${heard.errors}/${heard.words}) ouviu: "${heard.heard}"`);
  if (line.pronunciation().trim().endsWith('?')) countQuestion(totals, heard);
}

const summaryOf = (totals: Totals) =>
  `WER ${((100 * totals.errors) / Math.max(1, totals.words)).toFixed(1)}% (${totals.errors}/${totals.words} palavras) · perguntas percebidas ${totals.heardQuestions}/${totals.questions}`;

const mostMissed = (missed: ReadonlyMap<string, number>) =>
  [...missed].sort((first, second) => second[1] - first[1]).slice(0, 25).map(([word, times]) => `${word}×${times}`).join(' ');

/** Checks every line with a voice; writes output/asr.txt (report) and output/asr.json, and returns the report lines. */
export async function checkPronunciation(check: Check): Promise<string[]> {
  const totals: Totals = { errors: 0, words: 0, questions: 0, heardQuestions: 0, missed: new Map(), report: [] };
  const checked: Array<Readonly<{ heard: HeardLine | undefined; line: Line }>> = [];
  for (const line of check.project.script().lines().each()) checked.push({ heard: await heardLine(check, line), line });
  const withVoice = checked.filter((entry): entry is { heard: HeardLine; line: Line } => entry.heard !== undefined);
  withVoice.forEach((entry) => count(totals, entry));
  const heardLines = withVoice.map(({ heard }) => heard);
  const output = join(check.folder, 'output');
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'asr.txt'), `${[summaryOf(totals), ...totals.report].join('\n')}\n`);
  await writeFile(join(output, 'asr.json'), JSON.stringify(heardLines, null, 2));
  return [summaryOf(totals), `palavras mais erradas: ${mostMissed(totals.missed)}`, ...totals.report];
}
