import { basename, resolve } from 'node:path';
import type { IdeaFields, ProjectListing } from '../../shared/projects.ts';
import type { OpenedFolders, ProjectDisk, Trash } from '../ports/ProjectDisk.ts';
import type { ScriptCore } from '../ports/ScriptCore.ts';
import { translate } from '../text.ts';
import type { FolderGrants } from './FolderGrants.ts';
import { freeFolder, slugOf } from './folderNames.ts';
import { listingOf } from './projectListing.ts';
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

// What a copy leaves behind: the rendered video is made again from the copy.
const NOT_COPIED = ['output'];

/** The home screen's projects: the projects folder and the folders opened from elsewhere; new, copy, trash. */
export class ProjectsService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async list(): Promise<readonly ProjectListing[]> {
    const { disk, core } = this.#dependencies;
    const folders = await this.#projectFolders();
    const listings = await Promise.all(folders.map((folder) => listingOf(folder, { disk, core })));
    return listings.sort((first, second) => second.modified - first.modified);
  }

  /** A folder opened from elsewhere joins the list (and stays granted from then on). */
  async remember(folder: string): Promise<void> {
    const { opened, grants } = this.#dependencies;
    const path = grants.grant(folder);
    const known = await opened.read();
    if (!known.includes(path)) await opened.write([...known, path]);
  }

  async create(idea: IdeaFields): Promise<string> {
    const folder = await this.newFolder(idea.theme);
    await this.#dependencies.core.start(idea, folder);
    return folder;
  }

  /** A free folder for a new project in the projects folder, named after the theme. */
  async newFolder(theme: string): Promise<string> {
    return freeFolder(this.#dependencies.disk, await this.#root(), slugOf(theme));
  }

  /** The copy goes into the projects folder, with "(cópia)" after its title. */
  async duplicate(folder: string): Promise<string> {
    const { disk, grants } = this.#dependencies;
    const source = grants.require(folder);
    const target = await freeFolder(disk, await this.#root(), `${basename(source)}-${translate('home.copyFolder')}`);
    await disk.copy(source, target, NOT_COPIED);
    const project = (await disk.readJson(target, 'project.json').catch(() => null)) as Record<string, unknown> | null;
    if (project) await disk.writeJson(target, 'project.json', { ...project, title: `${String(project.title)} (${translate('home.copyTitle')})` });
    return target;
  }

  /** Only a project folder goes to the trash, never the projects folder itself. */
  async trash(folder: string): Promise<true> {
    const { disk, grants, trash, opened } = this.#dependencies;
    const path = grants.require(folder);
    if (!(await isProjectFolder(disk, path)) || path === (await this.#dependencies.projectsFolder())) throw new StudioError('invalid-request', translate('errors.notAProject', { folder: path }));
    await trash.trash(path);
    await opened.write((await opened.read()).filter((known) => known !== path));
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
  async #projectFolders(): Promise<readonly string[]> {
    const { disk, opened, grants } = this.#dependencies;
    const root = await this.#dependencies.projectsFolder();
    const inside = root === null ? [] : await disk.folders(root);
    const remembered = (await opened.read()).filter((folder) => !inside.includes(folder));
    const existing = await Promise.all(remembered.map(async (folder) => ((await disk.exists(folder)) ? [grants.grant(folder)] : [])));
    const all = [...inside, ...existing.flat()];
    const projects = await Promise.all(all.map(async (folder) => ((await isProjectFolder(disk, folder)) ? [folder] : [])));
    return projects.flat();
  }
}

async function isProjectFolder(disk: ProjectDisk, folder: string): Promise<boolean> {
  return (await disk.exists(resolve(folder, 'project.json'))) || (await disk.exists(resolve(folder, 'idea.json')));
}
