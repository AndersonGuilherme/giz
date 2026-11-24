import { join } from 'node:path';
import * as ort from 'onnxruntime-node';
import { usableDevice } from '../../gpu/deviceChoice.ts';
import { ortHasCuda } from '../../gpu/onnxRuntimeCuda.ts';
import { preloadCuda } from '../../gpu/preloadCuda.ts';
import { BpeTokenizer } from './BpeTokenizer.ts';
import { QwenEmbeddings } from './QwenEmbeddings.ts';
import { QwenSessions, type DeviceSettings } from './QwenSessions.ts';
import { predictFrame, type Predictor } from './codePredictor.ts';
import { readModelConfig, readSpeakers, talkerCacheShape, type QwenModelConfig } from './modelConfig.ts';
import { SAMPLES_PER_FRAME } from './qwenModels.ts';
import { seededRandom, sampleToken, type Sampling } from './sampling.ts';
import { prefill, talkerStep, type TalkerOutput } from './talker.ts';
import { talkerPrefix, type Prefix } from './talkerPrefix.ts';
import { addInto } from './vectors.ts';

export type GenerateOptions = Readonly<{
  speaker: string; language?: string; instruct?: string; seed?: number; temperature?: number; topK?: number; repetitionPenalty?: number; maxFrames?: number;
}>;
/** Where and how the model runs; with `cuda`, the NVIDIA libraries of `modelsDir` are preloaded first. */
export type LoadSettings = DeviceSettings & Readonly<{ modelsDir: string }>;
type Parts = Readonly<{ config: QwenModelConfig; tokenizer: BpeTokenizer; embeddings: QwenEmbeddings; sessions: QwenSessions; speakers: Readonly<Record<string, number>> }>;
type Run = Readonly<{ prefix: Prefix; sampling: Sampling; penalty: number; maxFrames: number }>;

type Generation = Readonly<{ talker: TalkerOutput; frames: number[][]; ended: boolean }>;

const FRAME_GROUPS = 16;

// The motor's sampling defaults: temperature 0.9, top 50, repetition penalty 1.05, at most 12 frames per text token.
function runOf(prefix: Prefix, options: GenerateOptions): Run {
  const sampling = { temperature: options.temperature ?? 0.9, topK: options.topK ?? 50, random: seededRandom(options.seed ?? 1) };
  return { prefix, sampling, penalty: options.repetitionPenalty ?? 1.05, maxFrames: options.maxFrames ?? Math.max(60, prefix.tokens * 12) };
}

/** The local Qwen3-TTS: text in, 24 kHz mono samples out. */
export class Qwen3Tts {
  readonly #parts: Parts;

  private constructor(parts: Parts) {
    this.#parts = parts;
  }

  static async load(folder: string, requested: LoadSettings): Promise<Qwen3Tts> {
    const settings = { ...requested, device: usableDevice(requested.device, ortHasCuda, (message) => console.warn(`AVISO: ${message}`)) };
    if (settings.device === 'cuda') preloadCuda(settings.modelsDir);
    const config = readModelConfig(folder);
    const sessions = await QwenSessions.load(folder, settings);
    const parts = { config, sessions, speakers: readSpeakers(folder), tokenizer: new BpeTokenizer(join(folder, 'tokenizer')) };
    return new Qwen3Tts({ ...parts, embeddings: QwenEmbeddings.load(folder, config) });
  }

  availableSpeakers(): string[] {
    return Object.keys(this.#parts.speakers);
  }

  async generate(text: string, options: GenerateOptions): Promise<Float32Array> {
    const speaker = this.#speakerId(options.speaker);
    const language = (options.language ?? 'portuguese').toLowerCase();
    const prefix = talkerPrefix(this.#parts, { text, speaker, language, instruct: options.instruct });
    const frames = await this.#frames(runOf(prefix, options));
    if (!frames.length) return new Float32Array(0);
    return this.#vocode(frames);
  }

  #speakerId(name: string): number {
    const id = this.#parts.speakers[name.toLowerCase()];
    if (id === undefined) throw new Error(`voz "${name}" não existe; disponíveis: ${this.availableSpeakers().join(', ')}`);
    return id;
  }

  // Frame by frame: group 0 from the talker, groups 1–15 from the code predictor, until the end-of-speech code.
  async #frames(run: Run): Promise<number[][]> {
    const { config, sessions } = this.#parts;
    let state: Generation = { talker: await prefill(sessions.decode(), run.prefix.rows, talkerCacheShape(config)), frames: [], ended: false };
    for (let step = 0; step < run.maxFrames && !state.ended; step++) state = await this.#step(state, { run, step });
    return state.frames;
  }

  async #step(state: Generation, { run, step }: Readonly<{ run: Run; step: number }>): Promise<Generation> {
    const { config, sessions, embeddings } = this.#parts;
    const firstCode = this.#firstCode(state.talker.logits, { run, frames: state.frames, step });
    if (firstCode === config.talker.codec_eos_token_id) return { ...state, ended: true };
    const predictor: Predictor = { session: sessions.predictor(), embeddings, config };
    const hidden = state.talker.hidden.slice(state.talker.hidden.length - config.talker.hidden_size);
    const codes = await predictFrame(predictor, { hidden, firstCode }, run.sampling);
    const talker = await this.#next(state.talker, { codes, run, step });
    return { talker, frames: [...state.frames, codes], ended: false };
  }

  // Group 0: repetition penalty on every code already used, only audio codes or the end, no end in the first 2 frames.
  #firstCode(logits: Float32Array, { run, frames, step }: Readonly<{ run: Run; frames: number[][]; step: number }>): number {
    const { talker, code_predictor: predictor } = this.#parts.config;
    const scores = logits.slice(logits.length - talker.vocab_size);
    for (const [code] of frames) scores[code] = scores[code] > 0 ? scores[code] / run.penalty : scores[code] * run.penalty;
    for (let code = predictor.vocab_size; code < talker.vocab_size; code++) scores[code] = code === talker.codec_eos_token_id ? scores[code] : -Infinity;
    if (step < 2) scores[talker.codec_eos_token_id] = -Infinity;
    return sampleToken(scores, run.sampling);
  }

  // The next talker input: the 16 code embeddings plus the next text token (or tts_pad once the text is over).
  #next(talker: TalkerOutput, { codes, run, step }: Readonly<{ codes: number[]; run: Run; step: number }>): Promise<TalkerOutput> {
    const { embeddings, sessions } = this.#parts;
    const embedding = new Float32Array(embeddings.codec(codes[0]));
    codes.slice(1).forEach((code, group) => addInto(embedding, embeddings.predictorCode(group, code)));
    addInto(embedding, run.prefix.trailing[step] ?? run.prefix.pad);
    return talkerStep(sessions.decode(), { embedding, position: run.prefix.rows.length + step, cache: talker.cache });
  }

  async #vocode(frames: readonly number[][]): Promise<Float32Array> {
    const count = frames.length;
    const flat = new BigInt64Array(FRAME_GROUPS * count);
    frames.forEach((codes, frame) => codes.forEach((code, group) => (flat[group * count + frame] = BigInt(code))));
    const audio = await this.#parts.sessions.vocode(new ort.Tensor('int64', flat, [1, FRAME_GROUPS, count]));
    if (audio.length !== count * SAMPLES_PER_FRAME) console.warn(`aviso: vocoder devolveu ${audio.length} amostras (esperado ${count * SAMPLES_PER_FRAME})`);
    return audio;
  }
}
