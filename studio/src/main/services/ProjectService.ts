import type { Aspect, CheckReport, ProjectSummary } from '../../shared/contract.ts';
import type { FolderPicker } from '../ports/FolderPicker.ts';
import type { Project, StudioCore } from '../ports/StudioCore.ts';
import type { FolderGrants } from './FolderGrants.ts';

/** `launchFolder`: the project folder given on the command line, if any (already granted by the composition). */
type Dependencies = Readonly<{ core: StudioCore; picker: FolderPicker; grants: FolderGrants; launchFolder: string | null }>;

function summaryOf(folder: string, project: Project): ProjectSummary {
  const script = project.script();
  const lines = script.lines();
  const cast = project.cast();
  const language = project.language();
  const aspect = project.aspect();
  return {
    folder,
    title: project.title(),
    format: project.format(),
    language: language.code(),
    aspect: aspect.text() as Aspect,
    cast: cast.ids(),
    chapters: script.chapters().length,
    lines: lines.count(),
    warnings: [...project.warnings()],
  };
}

// Plain copies: what goes over IPC must be serializable data, not core objects.
function plainReport(report: CheckReport): CheckReport {
  const copy = (problems: CheckReport['errors']) => problems.map(({ line, message }) => ({ line, message }));
  return { errors: copy(report.errors), warnings: copy(report.warnings) };
}

/** Opens and checks projects through core: the window gets a serializable summary or the check report. */
export class ProjectService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  /** The folder the person picks is granted: the window may open, check and render it from then on. */
  async pick(): Promise<string | null> {
    const { picker, grants } = this.#dependencies;
    const folder = await picker.pickFolder();
    return folder === null ? null : grants.grant(folder);
  }

  launched(): string | null {
    return this.#dependencies.launchFolder;
  }

  async open(folder: string): Promise<ProjectSummary> {
    const { core, grants } = this.#dependencies;
    const path = grants.require(folder);
    return summaryOf(path, await core.load(path));
  }

  async check(folder: string): Promise<CheckReport> {
    const { core, grants } = this.#dependencies;
    const path = grants.require(folder);
    return plainReport(await core.check(await core.load(path)));
  }
}
