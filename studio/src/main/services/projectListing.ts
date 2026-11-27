import { resolve } from 'node:path';
import type { ProjectListing } from '../../shared/projects.ts';
import type { ProjectDisk } from '../ports/ProjectDisk.ts';
import type { ScriptCore } from '../ports/ScriptCore.ts';
import { isStrictlyInside } from './folderNames.ts';

type Sources = Readonly<{ disk: ProjectDisk; core: ScriptCore; root: string | null }>;
type Profile = Readonly<Record<string, unknown>>;

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

// project.json when there is one; a project still at the idea stage only has idea.json (its theme is the title).
async function profileOf(folder: string, disk: ProjectDisk): Promise<Readonly<{ profile: Profile; problem?: string }>> {
  try {
    return { profile: (await disk.readJson(folder, 'project.json')) as Profile };
  } catch (error) {
    return ideaProfile(folder, disk, error);
  }
}

async function ideaProfile(folder: string, disk: ProjectDisk, error: unknown): Promise<Readonly<{ profile: Profile; problem?: string }>> {
  const idea = (await disk.readJson(folder, 'idea.json').catch(() => null)) as Profile | null;
  if (idea) return { profile: { ...idea, title: idea.theme } };
  return { profile: {}, problem: error instanceof Error ? error.message : String(error) };
}

/** One project on the home screen: its profile, the state of each stage and when it last changed. */
export async function listingOf(folder: string, { disk, core, root }: Sources): Promise<ProjectListing> {
  const inProjectsFolder = root !== null && isStrictlyInside(root, folder);
  const [{ profile, problem }, stages, modified] = await Promise.all([profileOf(folder, disk), core.stages(folder).catch(() => []), disk.modified(folder)]);
  const facts = { title: textOf(profile.title), format: textOf(profile.format), aspect: textOf(profile.aspect), language: textOf(profile.language) };
  return { folder, ...facts, stages, modified, inProjectsFolder, ...(problem ? { problem } : {}) };
}

/** A project folder has a project.json, or at least the idea.json it starts from. */
export async function isProjectFolder(disk: ProjectDisk, folder: string): Promise<boolean> {
  return (await disk.exists(resolve(folder, 'project.json'))) || (await disk.exists(resolve(folder, 'idea.json')));
}
