import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { problemLine } from '../../application/ports/ProjectError.ts';
import type { Cast } from '../../domain/cast/Cast.ts';
import type { Line } from '../../domain/script/Line.ts';
import type { Script } from '../../domain/script/Script.ts';
import type { ProblemCollector } from '../schema/errorMessages.ts';
import { isQwenVoice, QWEN_VOICES } from '../voice/qwen/qwenModels.ts';
import { fromWav } from '../voice/wav.ts';

/** With the qwen provider every cast voice must be a Qwen voice: `produce` would fail on the first line otherwise. */
export function checkQwenVoices(cast: Cast, collector: ProblemCollector): void {
  cast.each().forEach((character) => {
    const { id } = character.voice();
    if (isQwenVoice(id)) return;
    const file = `cast/${character.id().text()}.json`;
    collector.add({ file, path: 'voice.id', message: `a voz "${id}" não existe no Qwen (use ${QWEN_VOICES.join(', ')})` });
  });
}

const exists = (path: string) => access(path).then(() => true, () => false);

// Why the recording cannot be used (not a WAV, not 16-bit PCM), or nothing when it can.
async function failureOf(path: string): Promise<string | undefined> {
  try {
    fromWav(await readFile(path));
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}

async function recordingProblem(folder: string, line: Line): Promise<string | undefined> {
  const path = join(folder, 'recordings', `${line.id()}.wav`);
  if (!(await exists(path))) return `gravação não encontrada (fala ${line.id()}): grave "${line.pronunciation()}"`;
  const failure = await failureOf(path);
  return failure && `gravação inválida (fala ${line.id()}): ${failure}`;
}

async function recordingWarning(folder: string, line: Line): Promise<string | undefined> {
  const message = await recordingProblem(folder, line);
  return message && problemLine({ file: `recordings/${line.id()}.wav`, path: '', message });
}

/** With recordings, a line whose `recordings/<id>.wav` is missing or not a 16-bit PCM WAV is a warning. */
export async function recordingWarnings(folder: string, script: Script): Promise<string[]> {
  const warnings = await Promise.all(script.lines().each().map((line) => recordingWarning(folder, line)));
  return warnings.filter((text): text is string => text !== undefined);
}
