import { createHash } from 'node:crypto';
import type { VoiceRequest, VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import { Audio } from '../../domain/speech/Audio.ts';
import type { GizConfig } from '../config/GizConfig.ts';
import { ensureModel } from './qwen/modelDownload.ts';
import { Qwen3Tts } from './qwen/Qwen3Tts.ts';
import { QWEN_RATE, repositoryOf, type QwenModel } from './qwen/qwenModels.ts';

const QWEN_LANGUAGES: Readonly<Record<string, string>> = { 'pt-BR': 'portuguese', en: 'english' };
// 0.9 varied the intonation too much; 0.7 was picked by ear in the motor (2026-11-19).
const TEMPERATURE = 0.7;

type Install = Pick<GizConfig, 'model' | 'device' | 'threads' | 'modelsDir'>;
type Speaker = Pick<Qwen3Tts, 'generate'>;
type Load = (install: Install, model?: QwenModel) => Promise<Speaker>;

// Fixed seed per line: the same id and text always generate the same audio.
function seedOf(request: VoiceRequest): number {
  const digest = createHash('sha1').update(`${request.lineId}|${request.text}`).digest('hex');
  return parseInt(digest.slice(0, 8), 16);
}

/** Downloads the model on the first use and opens it on the configured device. */
export async function loadQwen(install: Install, model: QwenModel = install.model): Promise<Qwen3Tts> {
  const folder = await ensureModel(repositoryOf(model), install.modelsDir);
  return Qwen3Tts.load(folder, { device: install.device, threads: install.threads, modelsDir: install.modelsDir });
}

/** Local and free voice (Qwen3-TTS). The project `model` wins; without it, the one in giz.config.json applies. */
export class QwenVoice implements VoiceProvider {
  readonly #install: Install;
  readonly #model: QwenModel | undefined;
  readonly #load: Load;
  #tts: Promise<Speaker> | undefined;

  /** `load`: another loader (tests); by default the model is downloaded if needed and opened. */
  constructor(install: Install, model?: QwenModel, load: Load = loadQwen) {
    this.#install = install;
    this.#model = model;
    this.#load = load;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    const tts = await this.#loaded();
    const samples = await tts.generate(request.text, {
      speaker: request.voice,
      language: QWEN_LANGUAGES[request.language.code()],
      instruct: request.style || undefined,
      temperature: TEMPERATURE,
      seed: seedOf(request),
    });
    return Audio.of(samples, QWEN_RATE);
  }

  // A failed load (no model, no GPU library) is not kept: the next line loads again.
  #loaded(): Promise<Speaker> {
    this.#tts ??= this.#load(this.#install, this.#model).catch((error: unknown) => {
      this.#tts = undefined;
      throw error;
    });
    return this.#tts;
  }
}
