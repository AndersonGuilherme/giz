import { basename } from 'node:path';
import type { IdeaFields, ProjectListing } from '../../shared/projects.ts';
import type { OpenedFolders, ProjectDisk, Trash } from '../ports/ProjectDisk.ts';
import type { ScriptCore } from '../ports/ScriptCore.ts';
import { translate } from '../text.ts';
import type { FolderGrants } from './FolderGrants.ts';
import { freeFolder, isStrictlyInside, slugOf } from './folderNames.ts';
import { isProjectFolder, listingOf } from './projectListing.ts';
import { StudioError } from './StudioError.ts';

/** `projectsFolder`: the folder chosen in Settings (null before the first run ends). */
type Dependencies = Readonly<{
  core: ScriptCore;
  disk: ProjectDisk;
  trash: Trash;
  grants: FolderGrants;
  opened: OpenedFolders;
  projectsFolder: () => Promise<string | null>;
}>;

// What a copy leaves behind: what is made again from the project (the rendered video, the generated voices).
export const NOT_COPIED: readonly string[] = ['output', 'voice'];

const titleOf = (project: Readonly<Record<string, unknown>>, folder: string) => (typeof project.title === 'string' && project.title.trim() ? project.title : basename(folder));

/** The home screen's projects: the projects folder and the folders opened from elsewhere; new, copy, trash, forget. */
export class ProjectsService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async list(): Promise<readonly ProjectListing[]> {
    const { disk, core, projectsFolder } = this.#dependencies;
    const root = await projectsFolder();
    const folders = await this.#projectFolders(root);
    const listings = await Promise.all(folders.map((folder) => listingOf(folder, { disk, core, root })));
    return listings.sort((first, second) => second.modified - first.modified);
  }

  /** A folder opened from elsewhere joins the list (and stays granted from then on). */
  async remember(folder: string): Promise<void> {
    const { opened, grants } = this.#dependencies;
    const path = grants.grant(folder);
    const known = await opened.read();
    if (!known.includes(path)) await opened.write([...known, path]);
  }

  /** "Remover da lista": a folder opened from elsewhere leaves the list; nothing on disk is touched. */
  async forget(folder: string): Promise<true> {
    const { opened, grants } = this.#dependencies;
    const path = grants.require(folder);
    await opened.write((await opened.read()).filter((known) => known !== path));
    return true;
  }

  async create(idea: IdeaFields): Promise<string> {
    const folder = await this.newFolder(idea.theme);
    await this.#dependencies.core.start(idea, folder).catch(async (error: unknown) => {
      await this.release(folder);
      throw error;
    });
    return folder;
  }

  /** A new project's folder in the projects folder, named after the theme and made at once (no other run takes it). */
  async newFolder(theme: string): Promise<string> {
    const { disk } = this.#dependencies;
    const folder = await freeFolder(disk, await this.#root(), slugOf(theme));
    await disk.makeFolder(folder);
    return folder;
  }

  /** A reserved folder that stayed empty (a cancelled or failed run) is removed. */
  release(folder: string): Promise<void> {
    return this.#dependencies.disk.removeEmptyFolder(folder);
  }

  /** The copy goes into the projects folder, with "(cópia)" after its title. */
  async duplicate(folder: string): Promise<string> {
    const { disk, grants } = this.#dependencies;
    const source = grants.require(folder);
    const target = await freeFolder(disk, await this.#root(), `${basename(source)}-${translate('home.copyFolder')}`);
    await disk.copy(source, target, NOT_COPIED);
    const project = (await disk.readJson(target, 'project.json').catch(() => null)) as Readonly<Record<string, unknown>> | null;
    if (project) await disk.writeJson(target, 'project.json', { ...project, title: `${titleOf(project, source)} (${translate('home.copyTitle')})` });
    return target;
  }

  /** Only a project strictly inside the projects folder goes to the trash (ruling S3-I4); the others are only forgotten. */
  async trash(folder: string): Promise<true> {
    const { disk, grants, trash, projectsFolder } = this.#dependencies;
    const path = grants.require(folder);
    const root = await projectsFolder();
    const deletable = root !== null && isStrictlyInside(root, path) && (await isProjectFolder(disk, path));
    if (!deletable) throw new StudioError('invalid-request', translate('errors.notDeletable', { folder: path }));
    await trash.trash(path);
    return true;
  }

  stages(folder: string) {
    return this.#dependencies.core.stages(this.#dependencies.grants.require(folder));
  }

  async #root(): Promise<string> {
    const root = await this.#dependencies.projectsFolder();
    if (root === null) throw new StudioError('invalid-request', translate('errors.noProjectsFolder'));
    return root;
  }

  // The project folders of the projects folder, then the ones opened from elsewhere that still exist (granted again).
  async #projectFolders(root: string | null): Promise<readonly string[]> {
    const { disk, opened, grants } = this.#dependencies;
    const inside = root === null ? [] : await disk.folders(root);
    const remembered = (await opened.read()).filter((folder) => !inside.includes(folder));
    const existing = await Promise.all(remembered.map(async (folder) => ((await disk.exists(folder)) ? [grants.grant(folder)] : [])));
    const all = [...inside, ...existing.flat()];
    const projects = await Promise.all(all.map(async (folder) => ((await isProjectFolder(disk, folder)) ? [folder] : [])));
    return projects.flat();
  }
}
