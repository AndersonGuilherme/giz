import { outputFilesOf } from 'gizzycera-core/src/application/use-cases/RenderVideo.ts';
import type { Aspect, CheckReport, RenderedFiles } from '../../src/shared/contract.ts';
import type { DesktopShell } from '../../src/main/ports/DesktopShell.ts';
import type { StageItems } from '../../src/main/ports/MediaCore.ts';
import type { VideoBuild, VideoCore, VideoInspection, VideoRenderJob } from '../../src/main/ports/VideoCore.ts';
import { STAGES } from './scriptFakes.ts';

export const NO_ITEMS: StageItems = { stages: STAGES, voices: { stale: [], missing: [] }, scenarios: { stale: [], missing: [], blocked: [], problems: [] }, voiceDollars: 0 };

const LINES = [
  { lineId: 'a1', text: 'Oi.', speakerName: 'Lia' },
  { lineId: 'a2', text: 'Tudo bem?', speakerName: 'Téo' },
  { lineId: 'a3', text: 'Fim.', speakerName: 'Lia' },
];

type Render = (job: VideoRenderJob) => Promise<void>;

/** Core's Video stage, faked: a 16:9 project of three lines; the check per aspect, the items and the render are set by the test. */
export class FakeVideoCore implements VideoCore {
  projectAspect: Aspect = '16:9';
  checks: Partial<Record<Aspect, CheckReport>> = {};
  items_: StageItems = NO_ITEMS;
  buildError: Error | undefined;
  renderWith: Render = async () => undefined;
  /** Frames the render says it made (a short rehearsal render); undefined: the whole video. */
  renderedFrames: number | undefined;
  readonly inspected: Array<Aspect | undefined> = [];
  readonly aspectsRead: string[] = [];
  readonly built: Aspect[] = [];
  readonly renders: Array<Readonly<{ folder: string; aspect: Aspect; variant?: string }>> = [];

  async inspect(_folder: string, aspect: Aspect | undefined): Promise<VideoInspection> {
    this.inspected.push(aspect);
    const check = this.checks[aspect ?? this.projectAspect] ?? { errors: [], warnings: [] };
    return { projectAspect: this.projectAspect, title: 'O cupom', lines: LINES, check };
  }

  async aspectOf(folder: string): Promise<Aspect> {
    this.aspectsRead.push(folder);
    return this.projectAspect;
  }

  async items(): Promise<StageItems> {
    return this.items_;
  }

  async build(folder: string, aspect: Aspect): Promise<VideoBuild> {
    this.built.push(aspect);
    if (this.buildError) throw this.buildError;
    const props = { width: aspect === '9:16' ? 1080 : 1920, height: aspect === '9:16' ? 1920 : 1080, fps: 30 };
    return { props, files: [{ at: 'voice/a1.wav', from: `${folder}/voice/a1.wav` }, { at: 'sounds/pop.wav', from: '/core/public/sounds/pop.wav' }], seconds: 62.5, fps: 30 };
  }

  async servedFolders(): Promise<readonly string[]> {
    return ['/core/public/sounds', '/core/public/fonts'];
  }

  // Core's own naming rule, not a copy of it.
  async outputFiles(variant: string | undefined) {
    return outputFilesOf(variant);
  }

  async render(folder: string, aspect: Aspect, job: VideoRenderJob): Promise<RenderedFiles & Readonly<{ frames?: number }>> {
    this.renders.push({ folder, aspect, ...(job.variant ? { variant: job.variant } : {}) });
    await this.renderWith(job);
    const { video, captions } = outputFilesOf(job.variant);
    const files = { video: `${folder}/${video}`, captions: `${folder}/${captions}` };
    return this.renderedFrames === undefined ? files : { ...files, frames: this.renderedFrames };
  }
}

/** The desktop, faked: it records what was opened, copied and saved (`saveTo` null: the dialog was closed). */
export class FakeShell implements DesktopShell {
  readonly opened: string[] = [];
  readonly copied: string[] = [];
  readonly saved: Array<Readonly<{ from: string; name: string }>> = [];
  saveTo: string | null = '/home/ana/Documentos/cupom.srt';

  async openFolder(path: string) {
    this.opened.push(path);
  }

  async copyText(text: string) {
    this.copied.push(text);
  }

  async saveCopy(from: string, name: string) {
    this.saved.push({ from, name });
    return this.saveTo;
  }
}
