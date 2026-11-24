import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { comparableWords, wordErrors } from '../../domain/speech/WordErrorRate.ts';
import type { HeardLine } from './asrCheck.ts';

// Joins the automatic ear reports of every project in a folder and lists the words missed in SEVERAL of them (a
// systematic pronunciation problem, not chance). Port of the motor's scripts/asr-aggregate.ts.
type Missed = { times: number; projects: Set<string>; heard: string[] };

const IGNORED = new Set(['e', 'a', 'o', 'de', 'que', 'pra', 'um', 'uma', 'do', 'da', 'no', 'na', 'se', 'em', 'os', 'as', 'por', 'pro']);
const MAXIMUM_ROWS = 30;
const EXAMPLES = 2;

function reportOf(folder: string, project: string): HeardLine[] {
  const file = join(folder, project, 'output', 'asr.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as HeardLine[]) : [];
}

function collectWord(byWord: Map<string, Missed>, word: string, source: Readonly<{ project: string; heard: HeardLine }>): void {
  const missed = byWord.get(word) ?? { times: 0, projects: new Set<string>(), heard: [] };
  missed.times++;
  missed.projects.add(source.project);
  if (missed.heard.length < EXAMPLES) missed.heard.push(`${source.project}/${source.heard.line}: "${source.heard.heard.slice(0, 70)}"`);
  byWord.set(word, missed);
}

function collect(byWord: Map<string, Missed>, project: string, heard: HeardLine): void {
  const { missed } = wordErrors(comparableWords(heard.reference), comparableWords(heard.heard));
  missed.forEach((word) => collectWord(byWord, word, { project, heard }));
}

const relevant = ([word, missed]: [string, Missed]) => missed.projects.size >= 2 && !IGNORED.has(word) && !/^\d+$/.test(word);
const bySpread = (first: [string, Missed], second: [string, Missed]) =>
  second[1].projects.size - first[1].projects.size || second[1].times - first[1].times;
const rowOf = ([word, missed]: [string, Missed]) =>
  `${word.padEnd(16)} ${String(missed.times).padStart(3)}× em ${missed.projects.size} aulas  ${missed.heard[0] ?? ''}`;

/** The words missed in two or more projects (the subfolders of `folder` with an output/asr.json), most spread first. */
export function aggregatePronunciation(folder: string): string[] {
  const byWord = new Map<string, Missed>();
  const projects = readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  projects.forEach((project) => reportOf(folder, project).forEach((heard) => collect(byWord, project, heard)));
  return [...byWord].filter(relevant).sort(bySpread).slice(0, MAXIMUM_ROWS).map(rowOf);
}
