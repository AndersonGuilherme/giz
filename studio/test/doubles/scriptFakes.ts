import { dirname, join } from 'node:path';
import type { OpenedFolders, ProjectDisk, Trash } from '../../src/main/ports/ProjectDisk.ts';
import type { Generation, GenerationJob, ScriptCore, TextProviderName, Validation } from '../../src/main/ports/ScriptCore.ts';
import type { IdeaFields, Portraits, Presets, ScriptEstimate, StageBrief } from '../../src/shared/projects.ts';
import type { SceneProblem, Vocabulary } from '../../src/shared/script.ts';

export const STAGES: readonly StageBrief[] = [
  { stage: 'idea', state: 'done', problems: 0 }, { stage: 'script', state: 'stale', problems: 1 }, { stage: 'cast', state: 'done', problems: 0 },
  { stage: 'scenarios', state: 'done', problems: 0 }, { stage: 'voices', state: 'ready', problems: 3 }, { stage: 'video', state: 'ready', problems: 0 },
];

/** The project folders in memory: a map of file path → JSON text, plus the folders that exist and their mtimes. */
export class MemoryDisk implements ProjectDisk {
  readonly files = new Map<string, string>();
  readonly times = new Map<string, number>();
  readonly writes: string[] = [];

  put(folder: string, file: string, json: unknown): void {
    this.files.set(join(folder, file), JSON.stringify(json));
  }

  async folders(parent: string): Promise<readonly string[]> {
    const tops = [...this.files.keys()].filter((path) => path.startsWith(`${parent}/`)).map((path) => join(parent, path.slice(parent.length + 1).split('/')[0]!));
    return [...new Set(tops)].filter((path) => !this.files.has(path));
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || [...this.files.keys()].some((file) => file.startsWith(`${path}/`));
  }

  async readJson(folder: string, file: string): Promise<unknown> {
    const text = this.files.get(join(folder, file));
    if (text === undefined) throw new Error(`${file} não foi encontrado`);
    return JSON.parse(text);
  }

  async writeJson(folder: string, file: string, json: unknown): Promise<void> {
    this.writes.push(join(folder, file));
    this.files.set(join(folder, file), JSON.stringify(json));
  }

  async modified(folder: string): Promise<number> {
    return this.times.get(folder) ?? 0;
  }

  async copy(from: string, to: string, skip: readonly string[]): Promise<void> {
    const inside = [...this.files].filter(([path]) => path.startsWith(`${from}/`)).map(([path, text]) => [path.slice(from.length + 1), text] as const);
    inside.filter(([inner]) => !skip.includes(inner.split('/')[0]!)).forEach(([inner, text]) => this.files.set(join(to, inner), text));
  }

  remove(folder: string): void {
    [...this.files.keys()].filter((path) => path.startsWith(`${folder}/`)).forEach((path) => this.files.delete(path));
  }
}

export class MemoryTrash implements Trash {
  readonly trashed: string[] = [];
  readonly #disk: MemoryDisk;

  constructor(disk: MemoryDisk) {
    this.#disk = disk;
  }

  async trash(folder: string): Promise<void> {
    this.trashed.push(folder);
    this.#disk.remove(folder);
  }
}

export class MemoryOpened implements OpenedFolders {
  folders: readonly string[] = [];

  async read(): Promise<readonly string[]> {
    return this.folders;
  }

  async write(folders: readonly string[]): Promise<void> {
    this.folders = folders;
  }
}

type Generate = (idea: IdeaFields, job: GenerationJob) => Promise<Generation>;

/** Core's script stage, answering fixed data; `generate` can be replaced to drive progress, cancel and failures. */
export class FakeScriptCore implements ScriptCore {
  readonly started: Array<{ idea: IdeaFields; folder: string }> = [];
  readonly estimates: TextProviderName[] = [];
  validation: Validation = { errors: [], warnings: [] };
  portraitsFail = false;
  portraitCalls = 0;
  generator: Generate = async () => ({ repairs: 0, calls: 1 });
  stagesFail = new Set<string>();

  async stages(folder: string): Promise<readonly StageBrief[]> {
    if (this.stagesFail.has(folder)) throw new Error('não carrega');
    return STAGES;
  }

  async validate(): Promise<Validation> {
    return this.validation;
  }

  async start(idea: IdeaFields, folder: string): Promise<void> {
    this.started.push({ idea, folder });
  }

  async presets(): Promise<Presets> {
    return { cast: [{ id: 'bia', name: 'Bia', personality: 'streamer', rig: 'giz' }], scenes: [{ id: 'castle-rain', name: 'Castelo', description: 'chuva' }], backgrounds: ['room'] };
  }

  async portraits(folder: string): Promise<Portraits> {
    this.portraitCalls += 1;
    if (this.portraitsFail) throw new Error('sem Remotion');
    return { image: `data:image/png;base64,${dirname(folder)}`, cell: 160, columns: 8, ids: ['bia'] };
  }

  async estimate(_idea: IdeaFields, provider: TextProviderName): Promise<ScriptEstimate> {
    this.estimates.push(provider);
    return { provider, model: 'modelo', firstCall: 0.1, maximum: 1.07, calls: 4 };
  }

  generate(idea: IdeaFields, job: GenerationJob): Promise<Generation> {
    return this.generator(idea, job);
  }

  async vocabulary(): Promise<Vocabulary> {
    return { poses: ['neutral'], expressions: [], looks: [], sounds: [], sceneTypes: ['talk'], backgrounds: [], positions: [], directions: [], cameraMoves: [], effects: [], cardVariants: [], terminalTones: [] };
  }

  async checkScene(scene: unknown): Promise<readonly SceneProblem[]> {
    return (scene as { type?: string }).type === 'talk' ? [] : [{ path: 'type', message: 'tipo inválido' }];
  }
}

export const IDEA: IdeaFields = { format: 'story', aspect: '9:16', targetSeconds: 30, theme: 'E se os gatos falassem?', audience: 'jovens', tone: 'leve', language: 'pt-BR' };
