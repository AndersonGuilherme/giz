import type { CheckReport } from '../../src/shared/contract.ts';
import type { Cipher, KeyVault, SealedKeys } from '../../src/main/ports/KeyVault.ts';
import type { Project, RenderJob, StudioCore } from '../../src/main/ports/StudioCore.ts';

/** A core Project with only what the Studio reads (title, profile, cast, script). */
export function fakeProject(aspect: '9:16' | '16:9' = '16:9'): Project {
  return {
    title: () => 'O cupom',
    format: () => 'lesson',
    language: () => ({ code: () => 'pt-BR' }),
    aspect: () => ({ text: () => aspect }),
    cast: () => ({ ids: () => ['lia', 'teo'] }),
    script: () => ({ chapters: () => ['Abertura', 'Fim'], lines: () => ({ count: () => 12 }) }),
    warnings: () => ['imagem ausente'],
  } as unknown as Project;
}

type Render = (job: RenderJob) => Promise<void>;

/** A core that loads `project`, reports `report` and runs `render` (which drives the job's progress and signal). */
export class FakeCore implements StudioCore {
  readonly loads: string[] = [];
  readonly #project: Project;
  readonly #report: CheckReport;
  readonly #render: Render;

  constructor(project: Project, report: CheckReport = { errors: [], warnings: [] }, render: Render = async () => undefined) {
    this.#project = project;
    this.#report = report;
    this.#render = render;
  }

  async load(folder: string): Promise<Project> {
    this.loads.push(folder);
    return this.#project;
  }

  async check(): Promise<CheckReport> {
    return this.#report;
  }

  async render(folder: string, _project: Project, job: RenderJob) {
    await this.#render(job);
    return { video: `${folder}/output/video.mp4`, captions: `${folder}/output/captions.srt` };
  }
}

/** Reversible "encryption" that is visibly not the plain text. */
export class FakeCipher implements Cipher {
  readonly #available: boolean;

  constructor(available = true) {
    this.#available = available;
  }

  available(): boolean {
    return this.#available;
  }

  encrypt(text: string): string {
    return Buffer.from(`sealed:${text}`).toString('base64');
  }
}

export class InMemoryVault implements KeyVault {
  keys: SealedKeys = {};
  writes = 0;

  async read(): Promise<SealedKeys> {
    return this.keys;
  }

  async write(keys: SealedKeys): Promise<void> {
    this.keys = keys;
    this.writes += 1;
  }
}
