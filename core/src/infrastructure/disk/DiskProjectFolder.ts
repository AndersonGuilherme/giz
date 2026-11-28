import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CastFile, FailedDraft, ProjectFiles, ProjectFolder } from '../../application/ports/ProjectFolder.ts';
import type { ProjectVoice } from '../../domain/project/Project.ts';
import { CharacterId } from '../../domain/values/CharacterId.ts';

const IDEA = 'idea.json';

const asJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

function readFailure(folder: string, error: unknown): Error {
  const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
  return new Error(missing ? `${join(folder, IDEA)}: arquivo não encontrado` : `${join(folder, IDEA)}: JSON inválido (${(error as Error).message})`);
}

// Defence in depth: the id becomes a file name, so only a valid character id (no "/", no "..") is ever written.
function castPath(folder: string, character: CastFile): string {
  return join(folder, 'cast', `${CharacterId.of(character.id).text()}.json`);
}

async function writeFiles(folder: string, files: ProjectFiles): Promise<void> {
  const castPaths = files.cast.map((character) => castPath(folder, character));
  await mkdir(join(folder, 'cast'), { recursive: true });
  const cast = files.cast.map((character, index) => writeFile(castPaths[index]!, asJson(character)));
  const main = [writeFile(join(folder, IDEA), asJson(files.idea)), writeFile(join(folder, 'project.json'), asJson(files.project))];
  await Promise.all([...main, writeFile(join(folder, 'script.json'), asJson(files.script)), ...cast]);
}

// A JSON answer is kept indented (readable); anything else as the text that came.
function answerFile(answer: string): Readonly<{ name: string; content: string }> {
  try {
    return { name: 'answer.json', content: asJson(JSON.parse(answer)) };
  } catch {
    return { name: 'answer.txt', content: answer };
  }
}

/** Project folders on disk; the drafts go to a temporary folder, a failed one next to the project. */
export class DiskProjectFolder implements ProjectFolder {
  async readIdea(folder: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(join(folder, IDEA), 'utf8'));
    } catch (error) {
      throw readFailure(folder, error);
    }
  }

  // A missing or broken project.json keeps nothing: the regenerated project is validated anyway.
  async storedVoice(folder: string): Promise<ProjectVoice | undefined> {
    const reading = readFile(join(folder, 'project.json'), 'utf8').then((text) => JSON.parse(text) as { voice?: ProjectVoice });
    const project = await reading.catch(() => undefined);
    return project?.voice;
  }

  async staged<T>(files: ProjectFiles, use: (folder: string) => Promise<T>): Promise<T> {
    const folder = await mkdtemp(join(tmpdir(), 'gizzy-draft-'));
    try {
      await writeFiles(folder, files);
      return await use(folder);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  }

  save(folder: string, files: ProjectFiles): Promise<void> {
    return writeFiles(folder, files);
  }

  /** `<folder>.draft/`: the last answer (answer.json, or answer.txt when it is not JSON) and problems.txt. */
  async keepFailed(folder: string, draft: FailedDraft): Promise<string> {
    const target = `${folder.replace(/[/\\]+$/, '')}.draft`;
    const answer = answerFile(draft.answer);
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
    await writeFile(join(target, answer.name), answer.content);
    await writeFile(join(target, 'problems.txt'), `${draft.problems.join('\n')}\n`);
    return target;
  }
}
