import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ProjectFiles, ProjectFolder } from '../../application/ports/ProjectFolder.ts';
import type { ProjectVoice } from '../../domain/project/Project.ts';

const IDEA = 'idea.json';

const asJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

function readFailure(folder: string, error: unknown): Error {
  const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
  return new Error(missing ? `${join(folder, IDEA)}: arquivo não encontrado` : `${join(folder, IDEA)}: JSON inválido (${(error as Error).message})`);
}

async function writeFiles(folder: string, files: ProjectFiles): Promise<void> {
  await mkdir(join(folder, 'cast'), { recursive: true });
  const cast = files.cast.map((character) => writeFile(join(folder, 'cast', `${character.id}.json`), asJson(character)));
  const main = [writeFile(join(folder, IDEA), asJson(files.idea)), writeFile(join(folder, 'project.json'), asJson(files.project))];
  await Promise.all([...main, writeFile(join(folder, 'script.json'), asJson(files.script)), ...cast]);
}

/** Project folders on disk; the drafts go to a temporary folder. */
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
    const folder = await mkdtemp(join(tmpdir(), 'giz-draft-'));
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
}
