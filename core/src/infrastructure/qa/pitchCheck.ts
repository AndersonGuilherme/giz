import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import { endRise } from '../../domain/speech/Pitch.ts';
import { lineAudio } from './lineAudio.ts';

// `gizzy qa pitch`: how much the end of each question goes up (+) or down (−), in semitones. Port of the motor's
// scripts/pitch-check.ts.
async function questionRow(folder: string, line: Line): Promise<string | undefined> {
  const spoken = line.pronunciation();
  if (!spoken.trim().endsWith('?')) return undefined;
  const audio = await lineAudio(folder, line.id());
  if (!audio) return undefined;
  const rise = endRise(audio.samples(), audio.rate());
  const value = rise === null ? '  n/a' : `${rise >= 0 ? '+' : ''}${rise.toFixed(1)}`;
  return `${line.id()} ${value} st  "${spoken.slice(-42)}"`;
}

/** One row per question line with a voice. */
export async function checkQuestions(folder: string, project: Project): Promise<string[]> {
  const rows = await Promise.all(project.script().lines().each().map((line) => questionRow(folder, line)));
  return rows.filter((row): row is string => row !== undefined);
}
