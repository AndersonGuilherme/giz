import type { EditorCastMember, EditorReport, SceneProblem, ScriptDocument, ScriptJson, Vocabulary } from '../../shared/script.ts';
import type { ProjectDisk } from '../ports/ProjectDisk.ts';
import type { ScriptCore } from '../ports/ScriptCore.ts';
import { editorProblemOf } from './editorProblems.ts';
import { SCRIPT_FILE, scriptIn } from './scriptFile.ts';
import type { FolderGrants } from './FolderGrants.ts';

type Dependencies = Readonly<{ core: ScriptCore; disk: ProjectDisk; grants: FolderGrants }>;
type Json = Readonly<Record<string, unknown>>;

// A cast id names a file (cast/<id>.json): only a plain name is read, never a path.
const PLAIN_ID = /^[a-z0-9][a-z0-9_-]*$/i;
const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');
const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The script editor's files: it reads a project as JSON (a broken one still opens), saves the script and checks it. */
export class ScriptService {
  readonly #dependencies: Dependencies;
  readonly #queues = new Map<string, Promise<unknown>>();
  // The folders whose script.json was already kept as .bak in this run.
  readonly #backedUp = new Set<string>();

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async read(folder: string): Promise<ScriptDocument> {
    const { disk, grants } = this.#dependencies;
    const path = grants.require(folder);
    const project = (await disk.readJson(path, 'project.json')) as Json;
    const script = await scriptIn(disk, path);
    const profile = { title: textOf(project.title), format: textOf(project.format), aspect: textOf(project.aspect), language: textOf(project.language) };
    return { folder: path, ...profile, cast: await this.#cast(path, project.cast), script };
  }

  /**
   * script.json is replaced atomically, then the project is checked as it is now on disk. The saves of a folder run one
   * after the other (the newest always lands last); the first save of a run keeps the file as script.json.bak, and a
   * file that is not a script is never saved over.
   */
  async save(folder: string, script: ScriptJson): Promise<EditorReport> {
    const path = this.#dependencies.grants.require(folder);
    const run = (this.#queues.get(path) ?? Promise.resolve()).then(() => this.#save(path, script));
    const settled = run.catch(() => undefined);
    this.#queues.set(path, settled);
    void settled.then(() => (this.#queues.get(path) === settled ? this.#queues.delete(path) : undefined));
    return run;
  }

  /** Waits for every save in flight (the app waits for them before it quits). */
  async settled(): Promise<void> {
    await Promise.all([...this.#queues.values()]);
  }

  async check(folder: string): Promise<EditorReport> {
    const path = this.#dependencies.grants.require(folder);
    return this.#report(path, await scriptIn(this.#dependencies.disk, path));
  }

  vocabulary(): Promise<Vocabulary> {
    return this.#dependencies.core.vocabulary();
  }

  checkScene(scene: unknown): Promise<readonly SceneProblem[]> {
    return this.#dependencies.core.checkScene(scene);
  }

  async #save(folder: string, script: ScriptJson): Promise<EditorReport> {
    const { disk } = this.#dependencies;
    if (!this.#backedUp.has(folder)) {
      await scriptIn(disk, folder);
      await disk.backup(folder, SCRIPT_FILE);
      this.#backedUp.add(folder);
    }
    await disk.writeJson(folder, SCRIPT_FILE, script);
    return this.#report(folder, script);
  }

  async #report(folder: string, script: ScriptJson): Promise<EditorReport> {
    const { core } = this.#dependencies;
    const [validation, stages] = await Promise.all([core.validate(folder), core.stages(folder)]);
    const place = (problems: typeof validation.errors) => problems.map((problem) => editorProblemOf(problem, script));
    return { errors: place(validation.errors), warnings: place(validation.warnings), stages };
  }

  async #cast(folder: string, ids: unknown): Promise<readonly EditorCastMember[]> {
    const plain = (Array.isArray(ids) ? ids : []).map(textOf).filter((id) => PLAIN_ID.test(id));
    return Promise.all(plain.map((id) => this.#member(folder, id)));
  }

  async #member(folder: string, id: string): Promise<EditorCastMember> {
    const json = (await this.#dependencies.disk.readJson(folder, `cast/${id}.json`).catch(() => ({}))) as Json;
    return { id, name: textOf(json.name) || id, body: typeof json.rig === 'string' || isObject(json.parameters) };
  }
}
