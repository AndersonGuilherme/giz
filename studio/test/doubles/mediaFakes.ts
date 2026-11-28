import { basename, dirname, join } from 'node:path';
import type { CastCatalog, CharacterProblem, CharacterVoice } from '../../src/shared/cast.ts';
import type { ImageCost, ImageJob, MediaCore, MediaFiles, SampleVoice, SpokenSample, StageItems, VoiceJob } from '../../src/main/ports/MediaCore.ts';
import { STAGES } from './scriptFakes.ts';

export const CATALOG: CastCatalog = {
  rigs: [{ id: 'gizzy', name: { 'pt-BR': 'Gizzy', en: 'Gizzy' }, parameters: { skin: { type: 'option', defaultValue: 'light', options: ['light', 'deep'] }, glasses: { type: 'boolean', defaultValue: false } } }],
  qwenVoices: ['vivian', 'ryan'],
  styles: { 'pt-BR': 'Fale em português do Brasil', en: 'Speak in English' },
};

const NO_ITEMS: StageItems = { stages: STAGES, voices: { stale: [], missing: [] }, scenarios: { stale: [], missing: [], blocked: [], problems: [] }, voiceDollars: 0 };

/** Core's media stages, faked: it records each call, and its answers are set by the test. */
export class FakeMediaCore implements MediaCore {
  items_: StageItems = NO_ITEMS;
  problems: readonly CharacterProblem[] = [];
  readonly checked: unknown[] = [];
  readonly samples: Array<Readonly<{ voice: SampleVoice; request: CharacterVoice & { text: string; language: string } }>> = [];
  readonly imageJobs: ImageJob[] = [];
  readonly voiceJobs: VoiceJob[] = [];
  /** Runs inside generateImage / generateVoices (a test aborts there, or writes the files the job would make). */
  during: (job: ImageJob | VoiceJob) => Promise<void> = async () => undefined;
  wavProblem: string | undefined;

  async catalog() {
    return CATALOG;
  }

  async checkCharacter(json: unknown) {
    this.checked.push(json);
    return this.problems;
  }

  async presetFiles() {
    return [{ id: 'bia', name: 'Bia', personality: 'streamer', json: { id: 'bia', name: 'Bia', rig: 'gizzy', parameters: { skin: 'deep' }, voice: { id: 'vivian' }, defaultExpression: 'excited' } }];
  }

  async sample(voice: SampleVoice, request: CharacterVoice & { text: string; language: 'pt-BR' | 'en' }): Promise<SpokenSample> {
    this.samples.push({ voice, request });
    return { wav: new Uint8Array([82, 73, 70, 70]), seconds: 1.5, envelope: [0, 0.5], visemes: 'XA' };
  }

  async items(): Promise<StageItems> {
    return this.items_;
  }

  async imageCost(_folder: string, job: ImageJob): Promise<ImageCost> {
    return { model: `${job.provider}-model`, pending: 1, dollars: 0.08 };
  }

  async generateImage(_folder: string, job: ImageJob): Promise<void> {
    this.imageJobs.push(job);
    job.onCall?.();
    await this.during(job);
    job.signal?.throwIfAborted();
  }

  async generateVoices(_folder: string, job: VoiceJob): Promise<void> {
    this.voiceJobs.push(job);
    job.onLine?.(1, 1, job.only ?? '1');
    await this.during(job);
    job.signal?.throwIfAborted();
  }

  async imageFormat(bytes: Uint8Array) {
    return bytes[0] === 137 ? ('png' as const) : bytes[0] === 0xff ? ('jpeg' as const) : undefined;
  }

  async imageShape(path: string) {
    return path.includes('/own/') ? { width: 800, height: 800, matches: false } : { width: 1216, height: 2160, matches: true };
  }

  async checkWav(): Promise<void> {
    if (this.wavProblem) throw new Error(this.wavProblem);
  }
}

/** The media files in memory: path → bytes, with a modification time per write. */
export class MemoryMediaFiles implements MediaFiles {
  readonly files = new Map<string, Uint8Array>();
  readonly #times = new Map<string, number>();
  #clock = 1000;

  async write(folder: string, file: string, bytes: Uint8Array) {
    this.files.set(join(folder, file), bytes);
    this.#times.set(join(folder, file), (this.#clock += 1));
  }

  async read(folder: string, file: string) {
    return this.files.get(join(folder, file));
  }

  // A folder exists when some file is inside it, as on disk.
  async exists(folder: string, file: string) {
    const path = join(folder, file);
    return this.files.has(path) || [...this.files.keys()].some((known) => known.startsWith(`${path}/`));
  }

  async isFolder(folder: string, file: string) {
    const path = join(folder, file);
    return [...this.files.keys()].some((known) => known.startsWith(`${path}/`));
  }

  async modified(folder: string, file: string) {
    return this.#times.get(join(folder, file));
  }

  async remove(folder: string, file: string) {
    this.files.delete(join(folder, file));
    this.#times.delete(join(folder, file));
  }

  async entries(folder: string) {
    const inFolder = [...this.#times].filter(([path]) => dirname(path) === folder);
    return inFolder.map(([path, modified]) => ({ file: basename(path), modified }));
  }
}
