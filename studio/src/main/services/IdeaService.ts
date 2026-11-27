import type { GeneratedScript, IdeaFields, Portraits, Presets, ScriptEstimate, ScriptProgress } from '../../shared/projects.ts';
import { GenerationFailure, type ScriptCore, type TextProviderName } from '../ports/ScriptCore.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';

/**
 * `provider`: the text AI chosen in Settings; `keyOf` reads its key inside the main process (undefined: none saved);
 * `needsKey` false in rehearsal mode; `newFolder` a free folder for the theme in the projects folder; `portraitsFolder`
 * where the drawn portraits are kept.
 */
type Dependencies = Readonly<{
  core: ScriptCore;
  provider: () => Promise<TextProviderName>;
  keyOf: (provider: TextProviderName) => Promise<string | undefined>;
  needsKey: boolean;
  newFolder: (theme: string) => Promise<string>;
  /** Removes a reserved folder that stayed empty (the run was cancelled or failed). */
  release: (folder: string) => Promise<void>;
  portraitsFolder: string;
  progress: (progress: ScriptProgress) => void;
}>;

function failureOfGeneration(error: unknown, signal: AbortSignal): unknown {
  if (signal.aborted) return new StudioError('cancelled', translate('errors.generationCancelled'));
  if (!(error instanceof GenerationFailure)) return error;
  return new StudioError('failed', translate('errors.scriptNotValid'), { details: error.problems, path: error.draft });
}

/** The Idea stage: the ready characters and scenes, their portraits, and the script written by the text AI. */
export class IdeaService {
  readonly #dependencies: Dependencies;
  #portraits: Promise<Portraits | null> | undefined;
  #running: AbortController | undefined;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  presets(): Promise<Presets> {
    return this.#dependencies.core.presets();
  }

  /** Drawn once per run (and kept on disk between runs); null when they cannot be drawn: the picker shows initials. */
  portraits(): Promise<Portraits | null> {
    const { core, portraitsFolder } = this.#dependencies;
    this.#portraits ??= core.portraits(portraitsFolder).catch(() => null);
    return this.#portraits;
  }

  async estimate(idea: IdeaFields): Promise<ScriptEstimate> {
    const { core, provider } = this.#dependencies;
    return core.estimate(idea, await provider());
  }

  /**
   * One generation at a time, until core has settled (a cancelled one too); `cancel` aborts the call in flight and
   * answers at once, and nothing is saved.
   */
  async generate(idea: IdeaFields): Promise<GeneratedScript> {
    if (this.#running) throw new StudioError('busy', translate('errors.generationBusy'));
    const controller = new AbortController();
    this.#running = controller;
    const work = this.#generate(idea, controller.signal);
    void work.catch(() => undefined).then(() => (this.#running === controller ? (this.#running = undefined) : undefined));
    try {
      return await untilAborted(work, controller.signal);
    } catch (error) {
      throw failureOfGeneration(error, controller.signal);
    }
  }

  cancel(): boolean {
    this.#running?.abort();
    return this.#running !== undefined;
  }

  async #generate(idea: IdeaFields, signal: AbortSignal): Promise<GeneratedScript> {
    const { core, progress, newFolder } = this.#dependencies;
    const provider = await this.#dependencies.provider();
    const key = await this.#key(provider);
    const folder = await newFolder(idea.theme);
    const onCall = (call: number, most: number) => progress({ call, most });
    const { repairs, calls } = await core.generate(idea, { folder, provider, key, signal, onCall }).catch(async (error: unknown) => {
      await this.#dependencies.release(folder);
      throw error;
    });
    return { folder, repairs, calls };
  }

  async #key(provider: TextProviderName): Promise<string | undefined> {
    const { keyOf, needsKey } = this.#dependencies;
    const key = await keyOf(provider);
    if (needsKey && key === undefined) throw new StudioError('invalid-request', translate('errors.noTextKey', { provider }));
    return key;
  }
}

// A cancel answers at once: the call in flight is left to finish on its own, and core saves nothing after the abort.
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  const aborted = new Promise<never>((_done, fail) => signal.addEventListener('abort', () => fail(signal.reason), { once: true }));
  return Promise.race([work, aborted]);
}
