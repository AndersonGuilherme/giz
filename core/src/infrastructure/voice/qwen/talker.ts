import * as ort from 'onnxruntime-node';
import type { CacheShape } from './modelConfig.ts';

/** The key/value cache of a decoder (stacked by layer: layers × 1 × heads × positions × head size). */
export type KeyValueCache = Readonly<{ keys: ort.Tensor; values: ort.Tensor }>;
export type TalkerOutput = Readonly<{ logits: Float32Array; hidden: Float32Array; cache: KeyValueCache }>;
type Step = Readonly<{ embedding: Float32Array; position: number; cache: KeyValueCache }>;

export function emptyCache({ layers, heads, headSize }: CacheShape): KeyValueCache {
  const empty = () => new ort.Tensor('float32', new Float32Array(0), [layers, 1, heads, 0, headSize]);
  return { keys: empty(), values: empty() };
}

/** One talker position: the embedding of the position, attention over everything so far, 3D (m-RoPE) positions. */
export async function talkerStep(session: ort.InferenceSession, { embedding, position, cache }: Step): Promise<TalkerOutput> {
  const at = BigInt(position);
  const outputs = await session.run({
    inputs_embeds: new ort.Tensor('float32', embedding, [1, 1, embedding.length]),
    attention_mask: new ort.Tensor('int64', new BigInt64Array(position + 1).fill(1n), [1, position + 1]),
    position_ids: new ort.Tensor('int64', BigInt64Array.from([at, at, at]), [3, 1, 1]),
    past_keys: cache.keys,
    past_values: cache.values,
  });
  const next = { keys: outputs.present_keys, values: outputs.present_values };
  return { logits: outputs.logits.data as Float32Array, hidden: outputs.hidden_states.data as Float32Array, cache: next };
}

/** The prefix through the decode graph, one position at a time (the same result as the prefill graph, half the memory). */
export async function prefill(session: ort.InferenceSession, rows: readonly Float32Array[], shape: CacheShape): Promise<TalkerOutput> {
  let output: TalkerOutput = { logits: new Float32Array(0), hidden: new Float32Array(0), cache: emptyCache(shape) };
  for (const [position, embedding] of rows.entries()) output = await talkerStep(session, { embedding, position, cache: output.cache });
  return output;
}
