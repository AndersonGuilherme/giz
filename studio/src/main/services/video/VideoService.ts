import { basename, dirname, join } from 'node:path';
import { ASPECTS, type Aspect } from '../../../shared/contract.ts';
import type { RenderedVideo, VideoDocument, VideoMissing, VideoMontage } from '../../../shared/video.ts';
import type { DesktopShell } from '../../ports/DesktopShell.ts';
import type { MediaFiles } from '../../ports/MediaCore.ts';
import { translate } from '../../text.ts';
import type { FolderGrants } from '../FolderGrants.ts';
import { mediaUrlOf } from '../media/mediaUrls.ts';
import { StudioError } from '../StudioError.ts';
import type { BuildService, Montage } from './BuildService.ts';
import { outputOf, variantOf } from './outputFiles.ts';
import { historyOf } from './renderHistory.ts';

type Dependencies = Readonly<{ build: BuildService; files: MediaFiles; shell: DesktopShell; grants: FolderGrants }>;

const missingOf = ({ items }: Montage): VideoMissing => ({
  voices: items.voices.missing, staleVoices: items.voices.stale,
  images: items.scenarios.missing, staleImages: items.scenarios.stale, blockedImages: items.scenarios.blocked,
});

/** The Video stage: the preview document, the output folder and the captions of the last render in an aspect. */
export class VideoService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  /** "Montar", then everything the stage shows: the check in that aspect, what is missing, the renders made. */
  async preview(folder: string, aspect?: Aspect): Promise<VideoDocument> {
    const made = await this.#dependencies.build.montage(folder, aspect);
    const { inspection } = made;
    const [montage, rendered, renders] = await Promise.all([this.#montageOf(made), this.#rendered(made), historyOf(this.#dependencies.files, made.folder)]);
    const lines = inspection.lines.map((line, index) => ({ ...line, number: index + 1 }));
    const base = { folder: made.folder, title: inspection.title, projectAspect: inspection.projectAspect, aspect: made.aspect, lines, check: inspection.check };
    return { ...base, missing: missingOf(made), stages: made.items.stages, montage, failure: made.failure, rendered, renders };
  }

  /** The output folder (the project folder while nothing was rendered). */
  async openFolder(folder: string): Promise<true> {
    const { grants, files, shell } = this.#dependencies;
    const path = grants.require(folder);
    const output = (await files.exists(path, 'output')) ? join(path, 'output') : path;
    await shell.openFolder(output);
    return true;
  }

  async copyCaptions(folder: string, aspect: Aspect): Promise<true> {
    const { path, captions } = await this.#captions(folder, aspect);
    const bytes = await this.#dependencies.files.read(path, captions);
    await this.#dependencies.shell.copyText(new TextDecoder().decode(bytes));
    return true;
  }

  async exportCaptions(folder: string, aspect: Aspect): Promise<string | null> {
    const { path, captions } = await this.#captions(folder, aspect);
    const name = basename(captions).replace('captions', basename(path));
    return this.#dependencies.shell.saveCopy(join(path, captions), name);
  }

  async #captions(folder: string, aspect: Aspect) {
    const montage = await this.#dependencies.build.montage(folder, aspect);
    const { captions } = outputOf(variantOf(aspect, montage.inspection.projectAspect));
    if (!(await this.#dependencies.files.exists(montage.folder, captions))) throw new StudioError('invalid-request', translate('video.noCaptions', { aspect }));
    return { path: montage.folder, captions };
  }

  async #montageOf({ build }: Montage): Promise<VideoMontage | null> {
    if (!build) return null;
    const urls = await Promise.all(build.files.map(async ({ at, from }) => [at, mediaUrlOf(from, (await this.#dependencies.files.modified(dirname(from), basename(from))) ?? 0)] as const));
    return { video: build.props, files: Object.fromEntries(urls), seconds: build.seconds };
  }

  async #rendered({ folder, inspection }: Montage): Promise<readonly RenderedVideo[]> {
    const { files } = this.#dependencies;
    const found = await Promise.all(ASPECTS.map(async (aspect) => {
      const names = outputOf(variantOf(aspect, inspection.projectAspect));
      const version = await files.modified(folder, names.video);
      if (version === undefined) return [];
      return [{ aspect, url: mediaUrlOf(join(folder, names.video), version), captions: await files.exists(folder, names.captions) }];
    }));
    return found.flat();
  }
}
