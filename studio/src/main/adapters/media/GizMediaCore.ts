import type { CastCatalog, CharacterProblem, CharacterVoice } from '../../../shared/cast.ts';
import type { ImageCost, ImageJob, MediaCore, SampleVoice, SpokenSample, StageItems, VoiceJob } from '../../ports/MediaCore.ts';
import { generateImageIn, generateVoicesIn, imageCostOf, stageItemsOf, voiceKeys, type StandIns } from './coreJobs.ts';
import { coreAspect, coreCasting, coreImageFiles, coreLanguage, coreScriptMaterials, coreWav } from './mediaModules.ts';

type Sampler = Awaited<ReturnType<Awaited<ReturnType<typeof coreCasting>>['voiceSampler']>>;
type SampleRequest = CharacterVoice & Readonly<{ text: string; language: 'pt-BR' | 'en' }>;

/** Core's cast, scenarios and voices stages, through core's composition point (loaded on first use). */
export class GizMediaCore implements MediaCore {
  readonly #standIns: StandIns | undefined;
  // One sampler per voice service and model: the local voice loads its model once, then says every sample.
  readonly #samplers = new Map<string, Sampler>();

  /** `standIns`: the rehearsal voice and painter (rehearsal mode); none: the real services. */
  constructor(standIns?: StandIns) {
    this.#standIns = standIns;
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

  async sample(voice: SampleVoice, request: SampleRequest): Promise<SpokenSample> {
    const { Language } = await coreLanguage();
    const sampler = await this.#samplerOf(voice);
    const { wav, seconds, envelope, visemes } = await sampler({ text: request.text, voice: request.id, style: request.style, language: Language.of(request.language) });
    return { wav: new Uint8Array(wav), seconds, envelope, visemes };
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
    return generateVoicesIn(folder, job, this.#standIns);
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

  async #samplerOf(voice: SampleVoice): Promise<Sampler> {
    const name = `${voice.provider}:${voice.model ?? ''}`;
    const known = this.#samplers.get(name);
    if (known && voice.provider === 'qwen') return known;
    const casting = await coreCasting();
    const made = this.#standIns ? casting.voiceSamplerWith(this.#standIns.voice) : casting.voiceSampler({ ...voice, keys: voiceKeys(voice.key) });
    this.#samplers.set(name, made);
    return made;
  }
}
