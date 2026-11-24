import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** embeddings/config.json of the ONNX export: the sizes and control tokens of the talker and the code predictor. */
export type QwenModelConfig = Readonly<{
  talker: Readonly<{
    hidden_size: number; text_hidden_size: number; vocab_size: number; num_hidden_layers: number; num_key_value_heads: number; head_dim: number;
    codec_eos_token_id: number; codec_think_id: number; codec_nothink_id: number; codec_think_bos_id: number; codec_think_eos_id: number;
    codec_pad_id: number; codec_bos_id: number;
  }>;
  code_predictor: Readonly<{ hidden_size: number; vocab_size: number; num_hidden_layers: number; num_key_value_heads: number; head_dim: number }>;
  tts: Readonly<{ tts_bos_token_id: number; tts_eos_token_id: number; tts_pad_token_id: number }>;
  language_ids: Readonly<Record<string, number>>;
}>;

/** The shape of a key/value cache: layers × 1 × heads × positions × head size. */
export type CacheShape = Readonly<{ layers: number; heads: number; headSize: number }>;

export const embeddingFile = (folder: string, file: string): string => join(folder, 'embeddings', file);

export function readModelConfig(folder: string): QwenModelConfig {
  return JSON.parse(readFileSync(embeddingFile(folder, 'config.json'), 'utf8')) as QwenModelConfig;
}

export function readSpeakers(folder: string): Readonly<Record<string, number>> {
  return JSON.parse(readFileSync(embeddingFile(folder, 'speaker_ids.json'), 'utf8')) as Record<string, number>;
}

export const talkerCacheShape = ({ talker }: QwenModelConfig): CacheShape =>
  ({ layers: talker.num_hidden_layers, heads: talker.num_key_value_heads, headSize: talker.head_dim });

export const predictorCacheShape = ({ code_predictor: predictor }: QwenModelConfig): CacheShape =>
  ({ layers: predictor.num_hidden_layers, heads: predictor.num_key_value_heads, headSize: predictor.head_dim });
