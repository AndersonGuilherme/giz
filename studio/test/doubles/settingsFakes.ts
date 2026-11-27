import type { KeyCheck, KeyProvider } from '../../src/shared/accounts.ts';
import type { GpuStatus, ModelsStatus, SetupTask } from '../../src/shared/setup.ts';
import type { KeyChecker } from '../../src/main/ports/KeyChecker.ts';
import type { KeyFiles } from '../../src/main/ports/KeyFiles.ts';
import type { AppConfig, AppConfigStore, SharedConfigStore, SharedSettings } from '../../src/main/ports/SettingsStores.ts';
import type { SetupJob, SetupTools } from '../../src/main/ports/SetupTools.ts';

/** The CLI key files, in memory. */
export class InMemoryKeyFiles implements KeyFiles {
  readonly files = new Map<KeyProvider, string>();

  folder(): string {
    return '/home/ana/.config/giz';
  }

  async read(provider: KeyProvider): Promise<string | undefined> {
    return this.files.get(provider);
  }

  async write(provider: KeyProvider, key: string): Promise<void> {
    this.files.set(provider, key);
  }

  async remove(provider: KeyProvider): Promise<boolean> {
    return this.files.delete(provider);
  }
}

/** Checks text keys: `good` passes, anything else is refused with core's kind of message. */
export class FakeChecker implements KeyChecker {
  readonly checked: Array<[KeyProvider, string]> = [];

  supports(provider: KeyProvider): boolean {
    return ['anthropic', 'openai', 'gemini'].includes(provider);
  }

  async check(provider: KeyProvider, key: string): Promise<KeyCheck> {
    this.checked.push([provider, key]);
    if (key !== 'good') throw new Error('Anthropic: a chave foi recusada (401): confira se ela está certa e ativa');
    return { model: 'claude-sonnet-5-5', inputTokens: 11, outputTokens: 2 };
  }
}

const later = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

/** studio.json in memory; `delay` makes reads and writes slow, so overlapping read-modify-writes would lose changes. */
export class InMemoryAppConfig implements AppConfigStore {
  config: AppConfig | null = null;
  writes = 0;
  readonly #delay: number;

  constructor(delay = 0) {
    this.#delay = delay;
  }

  async read(): Promise<AppConfig | null> {
    await later(this.#delay);
    return this.config;
  }

  async write(config: AppConfig): Promise<void> {
    await later(this.#delay);
    this.config = config;
    this.writes += 1;
  }
}

export const CORE_DEFAULTS: SharedSettings = { modelsDir: '/home/ana/.cache/giz', device: 'cpu', model: '0.6b', remotionLicense: 'nao-informado' };

/** giz.config.json in memory: `others` stands for the keys the Studio does not own (they must survive every write). */
export class InMemorySharedConfig implements SharedConfigStore {
  values: SharedSettings = CORE_DEFAULTS;
  others = { brand: 'giz', voices: { lia: 'vivian' } };
  writes: Array<Partial<SharedSettings>> = [];

  async read(): Promise<SharedSettings> {
    return this.values;
  }

  async write(patch: Partial<SharedSettings>): Promise<SharedSettings> {
    this.writes.push(patch);
    this.values = { ...this.values, ...patch };
    return this.values;
  }

  async defaults(): Promise<SharedSettings> {
    return CORE_DEFAULTS;
  }
}

type Run = (task: SetupTask, job: SetupJob) => Promise<void>;

/** Setup tools whose tasks do what the test says (report progress, wait for the signal, fail). */
export class FakeSetupTools implements SetupTools {
  readonly runs: Array<[SetupTask, string]> = [];
  readonly #run: Run;

  constructor(run: Run = async () => undefined) {
    this.#run = run;
  }

  async gpu(modelsDir: string): Promise<GpuStatus> {
    return { gpu: { name: 'RTX', memoryMiB: 8192, driver: '1' }, supported: true, ready: modelsDir.endsWith('ready'), bytes: 2 };
  }

  async models(modelsDir: string): Promise<ModelsStatus> {
    const model = { ready: false, bytes: 1, onDiskBytes: 0 };
    return { modelsDir, freeBytes: 10, voice: { '0.6b': model, '1.7b': model }, whisper: model };
  }

  run(task: SetupTask, job: SetupJob): Promise<void> {
    this.runs.push([task, job.modelsDir]);
    return this.#run(task, job);
  }
}

/** Resolves when the signal aborts (a long download that only stops when told to). */
export const untilAborted = (signal: AbortSignal) => new Promise<void>((_done, fail) => signal.addEventListener('abort', () => fail(new Error('aborted')), { once: true }));
