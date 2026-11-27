import { ASPECTS } from '../../../shared/contract.ts';
import type { RenderRecord } from '../../../shared/video.ts';
import type { MediaFiles } from '../../ports/MediaCore.ts';
import { HISTORY_FILE } from './outputFiles.ts';

/** How many renders the history keeps. */
export const HISTORY_SIZE = 10;

const isRecord = (value: unknown): value is RenderRecord => {
  const record = value as Partial<RenderRecord> | null;
  return typeof record?.at === 'string' && ASPECTS.includes(record.aspect as never) && typeof record.seconds === 'number' && typeof record.video === 'string' && typeof record.captions === 'string';
};

function parsed(bytes: Uint8Array | undefined): readonly RenderRecord[] {
  if (!bytes) return [];
  try {
    const json: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return Array.isArray(json) ? json.filter(isRecord) : [];
  } catch {
    return [];
  }
}

/** The renders of the project, newest first (a missing or broken file is an empty history). */
export async function historyOf(files: MediaFiles, folder: string): Promise<readonly RenderRecord[]> {
  return parsed(await files.read(folder, HISTORY_FILE));
}

/** Adds a finished render on top; the oldest beyond HISTORY_SIZE leave. */
export async function recordRender(files: MediaFiles, folder: string, record: RenderRecord): Promise<readonly RenderRecord[]> {
  const history = [record, ...(await historyOf(files, folder))].slice(0, HISTORY_SIZE);
  await files.write(folder, HISTORY_FILE, new TextEncoder().encode(`${JSON.stringify(history, null, 2)}\n`));
  return history;
}
