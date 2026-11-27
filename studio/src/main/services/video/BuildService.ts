import type { Aspect } from '../../../shared/contract.ts';
import type { MontageFailure } from '../../../shared/video.ts';
import type { StageItems } from '../../ports/MediaCore.ts';
import type { VideoBuild, VideoCore, VideoInspection } from '../../ports/VideoCore.ts';
import { translate } from '../../text.ts';
import type { FolderGrants } from '../FolderGrants.ts';
import { StudioError } from '../StudioError.ts';

/** `serve` lets the media scheme serve a folder of the Studio's own (core's sound effects), without granting it. */
type Dependencies = Readonly<{ core: VideoCore; grants: FolderGrants; serve: (folder: string) => void }>;

/** The project in the chosen aspect, what its stages lack, and its montage (or why there is none). */
export type Montage = Readonly<{ folder: string; aspect: Aspect; inspection: VideoInspection; items: StageItems; build: VideoBuild | null; failure: MontageFailure | null }>;
export type ReadyMontage = Montage & Readonly<{ build: VideoBuild }>;

const numbersOf = (inspection: VideoInspection) => new Map(inspection.lines.map(({ lineId }, index) => [lineId, index + 1]));

/** One check problem as a readable line: "fala 3: …" (the whole project's own problems as they are). */
export function problemLine(inspection: VideoInspection, problem: Readonly<{ line: string; message: string }>): string {
  const number = numbersOf(inspection).get(problem.line);
  return number === undefined ? problem.message : translate('video.lineProblem', { number, message: problem.message });
}

function missingVoices(inspection: VideoInspection, missing: readonly string[]): MontageFailure | null {
  if (missing.length === 0) return null;
  const numbers = numbersOf(inspection);
  const lines = missing.map((lineId) => String(numbers.get(lineId) ?? lineId)).join(', ');
  return { message: translate('video.missingVoices', { count: missing.length, lines }), details: [], voices: missing };
}

const noMontage = (failure: MontageFailure | null) => new StudioError('invalid-project', failure?.message ?? translate('video.buildFailed'), failure?.details ?? []);

const failureOf = (error: unknown): MontageFailure => ({ message: translate('video.buildFailed'), details: [error instanceof Error ? error.message : String(error)], voices: [] });

/**
 * "Montar": every line with its voice becomes core's video props (BuildTimeline), in the chosen aspect. It runs before
 * the preview and before the render; without some voice it does not run and says which lines lack one.
 */
export class BuildService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  /** `aspect` absent: the project's own. */
  async montage(folder: string, aspect?: Aspect): Promise<Montage> {
    const { core, grants, serve } = this.#dependencies;
    const path = grants.require(folder);
    const [inspection, items] = await Promise.all([core.inspect(path, aspect), core.items(path)]);
    const base = { folder: path, aspect: aspect ?? inspection.projectAspect, inspection, items };
    const failure = missingVoices(inspection, items.voices.missing);
    if (failure) return { ...base, build: null, failure };
    try {
      const build = await core.build(path, base.aspect);
      serve(await core.soundsFolder());
      return { ...base, build, failure: null };
    } catch (error) {
      return { ...base, build: null, failure: failureOf(error) };
    }
  }

  /** The montage the render needs: a readable error when a voice is missing or the check in that aspect finds errors. */
  async ready(folder: string, aspect: Aspect): Promise<ReadyMontage> {
    const montage = await this.montage(folder, aspect);
    if (!montage.build) throw noMontage(montage.failure);
    const { errors } = montage.inspection.check;
    if (errors.length > 0) throw new StudioError('invalid-project', translate('video.checkErrors', { count: errors.length, aspect }), errors.map((problem) => problemLine(montage.inspection, problem)));
    return { ...montage, build: montage.build };
  }
}
