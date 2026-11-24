import { join } from 'node:path';

// Qwen3-TTS (Alibaba Qwen, Apache-2.0) running LOCALLY (CPU or NVIDIA GPU) with only Node and ONNX Runtime (no
// Python). Weights: the ONNX export of the 12Hz CustomVoice 0.6B or 1.7B models
// (huggingface.co/elbruno/Qwen3-TTS-12Hz-*-CustomVoice-ONNX), downloaded once into <modelsDir>. The 1.7B follows
// style instructions ("fale empolgado"). Pipeline:
//   text → tokens (Qwen BPE) → talker (LM, one audio frame every 80 ms, group 0)
//   → code predictor (groups 1–15 of the frame) → vocoder (16 codes per frame → 24 kHz)
// Architecture reference: github.com/QwenLM/Qwen3-TTS and github.com/elbruno/qwen-labs-cs (C#).
export const QWEN_RATE = 24000;
export const SAMPLES_PER_FRAME = 1920;

export const QWEN_MODELS = {
  '0.6b': { repo: 'elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX', gigabytes: 5.9, instruct: false },
  '1.7b': { repo: 'elbruno/Qwen3-TTS-12Hz-1.7B-CustomVoice-ONNX', gigabytes: 13.4, instruct: true },
} as const;
export type QwenModel = keyof typeof QWEN_MODELS;

/** The built-in voices of the Qwen3-TTS CustomVoice models, by speaker id (core owns this list). */
export const QWEN_VOICES = ['serena', 'vivian', 'uncle_fu', 'ryan', 'aiden', 'ono_anna', 'sohee', 'eric', 'dylan'] as const;
export type QwenVoiceId = (typeof QWEN_VOICES)[number];

/** Whether a cast file's `voice.id` is one of the Qwen voices. */
export const isQwenVoice = (id: string): id is QwenVoiceId => (QWEN_VOICES as readonly string[]).includes(id);

/** The Hugging Face repository of the model; QWEN_TTS_REPO points to another export (tests of a new one). */
export const repositoryOf = (model: QwenModel, env: Readonly<Record<string, string | undefined>> = process.env): string =>
  env.QWEN_TTS_REPO ?? QWEN_MODELS[model].repo;

/** <modelsDir>/<owner>__<name>: the folder of a downloaded model (the motor's layout). */
export const modelFolder = (repository: string, modelsDir: string): string => join(modelsDir, repository.replace('/', '__'));
