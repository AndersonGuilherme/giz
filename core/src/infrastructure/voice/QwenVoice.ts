import { createHash } from 'node:crypto';
import type { VoiceRequest, VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import { Audio } from '../../domain/speech/Audio.ts';
// temporary until the Migration phase
import { ensureModel, Qwen3TTS, QWEN_MODELS, QWEN_RATE, type QwenModel } from '../../../../motor/scripts/qwen3-tts.ts';

const QWEN_LANGUAGES: Readonly<Record<string, string>> = { 'pt-BR': 'portuguese', en: 'english' };
// 0.9 varied the intonation too much; 0.7 was picked by ear in the motor (2026-11-19).
const TEMPERATURE = 0.7;

// Fixed seed per line: the same id and text always generate the same audio.
function seedOf(request: VoiceRequest): number {
  const digest = createHash('sha1').update(`${request.lineId}|${request.text}`).digest('hex');
  return parseInt(digest.slice(0, 8), 16);
}

async function load(model: QwenModel | undefined): Promise<Qwen3TTS> {
  if (!model) return Qwen3TTS.load();
  return Qwen3TTS.load(await ensureModel(QWEN_MODELS[model].repo));
}

/** Local and free voice (Qwen3-TTS). Without `model`, the one in giz.config.json applies. */
export class QwenVoice implements VoiceProvider {
  readonly #model: QwenModel | undefined;
  #tts: Promise<Qwen3TTS> | undefined;

  constructor(model?: QwenModel) {
    this.#model = model;
  }

  async generate(request: VoiceRequest): Promise<Audio> {
    this.#tts ??= load(this.#model);
    const tts = await this.#tts;
    const samples = await tts.generate(request.text, {
      speaker: request.voice,
      language: QWEN_LANGUAGES[request.language.code()],
      instruct: request.style || undefined,
      temperature: TEMPERATURE,
      seed: seedOf(request),
    });
    return Audio.of(samples, QWEN_RATE);
  }
}
