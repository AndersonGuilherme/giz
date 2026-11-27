import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { ProjectStateReader } from '../../application/ports/ProjectStateReader.ts';
import type { VideoFacts } from '../../domain/stages/ProjectStages.ts';

const VIDEO = join('output', 'video.mp4');
// What the video is not made from: the render output itself and the idea (only the script is made from it).
const NOT_INPUTS = new Set(['output', 'idea.json']);

const isInput = (name: string): boolean => !name.startsWith('.') && !NOT_INPUTS.has(name);

// The newest change among the project files (recursive, hidden files skipped); 0 for an empty folder.
async function newestChange(folder: string): Promise<number> {
  const entries = await readdir(folder, { withFileTypes: true, recursive: true });
  const files = entries.filter((entry) => entry.isFile() && isInput(relativeTop(folder, entry)) && !entry.name.startsWith('.'));
  const times = await Promise.all(files.map(async (entry) => (await stat(join(entry.parentPath, entry.name))).mtimeMs));
  return Math.max(0, ...times);
}

// The first folder (or the file name) of an entry under the project folder: `output/x.png` → `output`.
function relativeTop(folder: string, entry: Readonly<{ parentPath: string; name: string }>): string {
  const inside = relative(folder, join(entry.parentPath, entry.name));
  return inside.split(sep)[0] ?? inside;
}

/** The project folder on disk: `idea.json`, `script.json` and how `output/video.mp4` compares with the project files. */
export class DiskProjectStateReader implements ProjectStateReader {
  async hasIdea(folder: string): Promise<boolean> {
    return existsSync(join(folder, 'idea.json'));
  }

  async hasScript(folder: string): Promise<boolean> {
    return existsSync(join(folder, 'script.json'));
  }

  // By modification time: a project file changed after the render makes the video older than its inputs.
  async video(folder: string): Promise<VideoFacts> {
    const path = join(folder, VIDEO);
    if (!existsSync(path)) return { made: false, olderThanInputs: false };
    const [rendered, newest] = await Promise.all([stat(path), newestChange(folder)]);
    return { made: true, olderThanInputs: newest > rendered.mtimeMs };
  }
}
