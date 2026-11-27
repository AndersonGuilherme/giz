import { join } from 'node:path';
import { MAXIMUM_RECORDING_BYTES, type VoiceLine, type VoiceProgress, type VoicesDocument, type VoiceState } from '../../../shared/voices.ts';
import type { MediaCore, MediaFiles, StageItems } from '../../ports/MediaCore.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { translate } from '../../text.ts';
import type { FolderGrants } from '../FolderGrants.ts';
import { StudioError } from '../StudioError.ts';
import { characterOf, projectVoiceOf } from './castFiles.ts';
import { mediaUrlOf } from './mediaUrls.ts';
import { OneJob } from './OneJob.ts';
import { castIdsOf, lineIn, projectOf, scriptOf, type ScriptLine } from './projectJson.ts';

/** `keyOf` reads a paid voice's key in main; `needsKey` false in rehearsal mode. */
type Dependencies = Readonly<{
  core: MediaCore;
  disk: ProjectDisk;
  files: MediaFiles;
  grants: FolderGrants;
  keyOf: (service: 'elevenlabs' | 'fish') => Promise<string | undefined>;
  needsKey: boolean;
  progress: (progress: VoiceProgress) => void;
}>;

const PAID = ['elevenlabs', 'fish'] as const;
type Paid = (typeof PAID)[number];
const isPaid = (provider: string): provider is Paid => (PAID as readonly string[]).includes(provider);
const takeOf = (lineId: string) => `recordings/${lineId}.wav`;

function stateOf(lineId: string, items: StageItems['voices']): VoiceState {
  if (items.stale.includes(lineId)) return 'stale';
  return items.missing.includes(lineId) ? 'missing' : 'done';
}

/** The Voices stage: every line's audio, made by the project voice or taken from the person's own recording. */
export class VoiceService {
  readonly #dependencies: Dependencies;
  readonly #job = new OneJob();

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async read(folder: string): Promise<VoicesDocument> {
    const { disk, core, grants } = this.#dependencies;
    const path = grants.require(folder);
    const [project, script, items] = await Promise.all([projectOf(disk, path), scriptOf(disk, path), core.items(path)]);
    const names = await this.#names(path, castIdsOf(project));
    const lines = await Promise.all(script.lines.map((line, index) => this.#lineOf(path, { line, number: index + 1, names, items: items.voices })));
    const pending = lines.filter(({ state }) => state !== 'done').length;
    return { folder: path, provider: projectVoiceOf(project).provider, lines, pending, dollars: items.voiceDollars, stages: items.stages };
  }

  /** Every pending line (`lineId` absent) or that one line, made again; one job at a time, cancellable between lines. */
  generate(folder: string, lineId?: string): Promise<VoicesDocument> {
    const path = this.#dependencies.grants.require(folder);
    return this.#job.run(async (signal) => {
      if (lineId !== undefined) lineIn((await scriptOf(this.#dependencies.disk, path)).lines, lineId);
      const key = await this.#key(path);
      const onLine = (done: number, total: number, line: string) => this.#dependencies.progress({ done, total, lineId: line });
      await this.#dependencies.core.generateVoices(path, { only: lineId, key, signal, onLine });
      return this.read(path);
    });
  }

  cancel(): boolean {
    return this.#job.cancel();
  }

  /** The take must be a 16-bit PCM WAV; it is saved as recordings/<id>.wav and the line is made from it at once. */
  async record(folder: string, lineId: string, wav: Uint8Array): Promise<VoicesDocument> {
    const { disk, grants, core, files } = this.#dependencies;
    const path = grants.require(folder);
    lineIn((await scriptOf(disk, path)).lines, lineId);
    if (wav.byteLength > MAXIMUM_RECORDING_BYTES) throw new StudioError('invalid-request', translate('voices.tooLong'));
    await core.checkWav(wav).catch((error: unknown) => {
      throw new StudioError('invalid-request', translate('voices.notAWav'), [error instanceof Error ? error.message : String(error)]);
    });
    await files.write(path, takeOf(lineId), wav);
    return this.generate(path, lineId);
  }

  /** Without its take, the line goes back to the project voice. */
  async unrecord(folder: string, lineId: string): Promise<VoicesDocument> {
    const path = this.#dependencies.grants.require(folder);
    lineIn((await scriptOf(this.#dependencies.disk, path)).lines, lineId);
    await this.#dependencies.files.remove(path, takeOf(lineId));
    return this.generate(path, lineId);
  }

  async #lineOf(folder: string, context: Readonly<{ line: ScriptLine; number: number; names: ReadonlyMap<string, string>; items: StageItems['voices'] }>): Promise<VoiceLine> {
    const { line, number, names, items } = context;
    const { files } = this.#dependencies;
    const [version, recorded] = await Promise.all([files.modified(folder, `voice/${line.id}.wav`), files.exists(folder, takeOf(line.id))]);
    const audio = version === undefined ? null : mediaUrlOf(join(folder, 'voice', `${line.id}.wav`), version);
    const speaker = String(line.speaker);
    return { lineId: line.id, number, speaker, speakerName: names.get(speaker) ?? speaker, text: String(line.text), state: stateOf(line.id, items), recorded, audio };
  }

  async #names(folder: string, ids: readonly string[]): Promise<ReadonlyMap<string, string>> {
    const read = (id: string) => this.#dependencies.disk.readJson(folder, `cast/${id}.json`).catch(() => ({}));
    const files = await Promise.all(ids.map(async (id) => characterOf(id, await read(id))));
    return new Map(files.map(({ id, name }) => [id, name]));
  }

  async #key(folder: string): Promise<string | undefined> {
    const { provider } = projectVoiceOf(await projectOf(this.#dependencies.disk, folder));
    if (!isPaid(provider)) return undefined;
    const key = await this.#dependencies.keyOf(provider);
    if (this.#dependencies.needsKey && key === undefined) throw new StudioError('invalid-request', translate('voices.noKey', { provider }));
    return key;
  }
}
