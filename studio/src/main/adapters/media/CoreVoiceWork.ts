import type { VoiceProvider } from 'giz-core/src/application/ports/VoiceProvider.ts';
import type { SampleVoice, SpokenSample, VoiceJob } from '../../ports/MediaCore.ts';
import type { SampleRequest, VoiceWork } from '../../ports/VoiceWork.ts';
import { voiceKeys } from './coreJobs.ts';
import { coreCasting, coreLanguage, coreMain, coreWorkshop } from './mediaModules.ts';

type Workshop = ReturnType<Awaited<ReturnType<typeof coreWorkshop>>['voiceWorkshop']>;

/**
 * Core's voice work in this process (the voice worker's, or a test's): one workshop for the process's whole life, so
 * the local voice and Whisper load once. `standIn`: the rehearsal voice, for lines and samples alike (no Whisper).
 */
export class CoreVoiceWork implements VoiceWork {
  readonly #standIn: VoiceProvider | undefined;
  #workshop: Promise<Workshop> | undefined;

  constructor(standIn?: VoiceProvider) {
    this.#standIn = standIn;
  }

  async generate(folder: string, job: VoiceJob): Promise<void> {
    const [workshop, project] = [await this.#opened(), await (await coreMain()).projectRepository().load(folder)];
    const options = this.#standIn ? { voice: this.#standIn, whisper: false } : { keys: voiceKeys(job.key) };
    const onProgress = ({ done, total, lineId }: Readonly<{ done: number; total: number; lineId: string }>) => job.onLine?.(done, total, lineId);
    const only = job.only === undefined ? undefined : [job.only];
    await workshop.lines(folder, project, options).run(project, onProgress, { only, force: job.only !== undefined, signal: job.signal });
  }

  async sample(voice: SampleVoice, request: SampleRequest): Promise<SpokenSample> {
    const { Language } = await coreLanguage();
    const sampler = await this.#samplerOf(voice);
    const { wav, seconds, envelope, visemes } = await sampler({ text: request.text, voice: request.id, style: request.style, language: Language.of(request.language) });
    return { wav: new Uint8Array(wav), seconds, envelope, visemes };
  }

  async #samplerOf(voice: SampleVoice) {
    if (this.#standIn) return (await coreCasting()).voiceSamplerWith(this.#standIn);
    return (await this.#opened()).sampler({ provider: voice.provider, model: voice.model, keys: voiceKeys(voice.key) });
  }

  #opened(): Promise<Workshop> {
    this.#workshop ??= coreWorkshop().then(({ voiceWorkshop }) => voiceWorkshop());
    return this.#workshop;
  }
}
