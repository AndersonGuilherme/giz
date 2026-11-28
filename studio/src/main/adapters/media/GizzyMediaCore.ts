import type { CastCatalog, CharacterProblem } from '../../../shared/cast.ts';
import type { ImageCost, ImageJob, MediaCore, SampleVoice, SpokenSample, StageItems, VoiceJob } from '../../ports/MediaCore.ts';
import type { SampleRequest, VoiceWork } from '../../ports/VoiceWork.ts';
import { generateImageIn, imageCostOf, stageItemsOf, type StandIns } from './coreJobs.ts';
import { CoreVoiceWork } from './CoreVoiceWork.ts';
import { coreAspect, coreCasting, coreImageFiles, coreScriptMaterials, coreWav } from './mediaModules.ts';

/** Core's cast, scenarios and voices stages, through core's composition point (loaded on first use). */
export class GizzyMediaCore implements MediaCore {
  readonly #standIns: StandIns | undefined;
  readonly #voices: VoiceWork;

  /**
   * `standIns`: the rehearsal voice and painter (rehearsal mode); none: the real services. `voices`: where the voice
   * work runs (the Studio's voice worker); by default in this process.
   */
  constructor(standIns?: StandIns, voices: VoiceWork = new CoreVoiceWork(standIns?.voice)) {
    this.#standIns = standIns;
    this.#voices = voices;
  }

  async catalog(): Promise<CastCatalog> {
    const casting = await coreCasting();
    const voices = casting.castVoices();
    return structuredClone({ rigs: casting.rigCatalog(), qwenVoices: [...voices.qwen], styles: voices.styles });
  }

  async checkCharacter(json: unknown): Promise<readonly CharacterProblem[]> {
    return (await coreCasting()).checkCharacter(json).map(({ path, message }) => ({ path, message }));
  }

  async presetFiles() {
    const presets = await (await coreScriptMaterials()).scriptMaterials().castPresets();
    return presets.map(({ id, name, personality, json }) => ({ id, name, personality, json }));
  }

  sample(voice: SampleVoice, request: SampleRequest): Promise<SpokenSample> {
    return this.#voices.sample(voice, request);
  }

  items(folder: string): Promise<StageItems> {
    return stageItemsOf(folder);
  }

  imageCost(folder: string, job: ImageJob): Promise<ImageCost> {
    return imageCostOf(folder, job, this.#standIns);
  }

  generateImage(folder: string, job: ImageJob): Promise<void> {
    return generateImageIn(folder, job, this.#standIns);
  }

  generateVoices(folder: string, job: VoiceJob): Promise<void> {
    return this.#voices.generate(folder, job);
  }

  async imageFormat(bytes: Uint8Array): Promise<'png' | 'jpeg' | 'webp' | undefined> {
    return (await coreImageFiles()).imageFormatOf(bytes);
  }

  async imageShape(path: string, aspect: '9:16' | '16:9') {
    const [{ imageSize }, { AspectRatio }] = await Promise.all([coreImageFiles(), coreAspect()]);
    const size = await imageSize(path).catch(() => undefined);
    return size && { ...size, matches: AspectRatio.of(aspect).matches(size.width, size.height) };
  }

  async checkWav(bytes: Uint8Array): Promise<void> {
    (await coreWav()).fromWav(Buffer.from(bytes));
  }
}
