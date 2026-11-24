import * as ort from 'onnxruntime-node';
import type { QwenEmbeddings } from './QwenEmbeddings.ts';
import { predictorCacheShape, type QwenModelConfig } from './modelConfig.ts';
import { sampleToken, type Sampling } from './sampling.ts';
import { emptyCache, type KeyValueCache } from './talker.ts';

const GROUPS = 16;

export type Predictor = Readonly<{ session: ort.InferenceSession; embeddings: QwenEmbeddings; config: QwenModelConfig }>;
type Step = Readonly<{ input: Float32Array; cache: KeyValueCache }>;

// The first input is the last talker hidden state plus the group 0 code (two positions); then one code at a time.
function firstInput({ embeddings }: Predictor, hidden: Float32Array, firstCode: number): Float32Array {
  const width = embeddings.predictorWidth();
  const input = new Float32Array(2 * width);
  input.set(embeddings.toPredictor(hidden), 0);
  input.set(embeddings.toPredictor(new Float32Array(embeddings.codec(firstCode)), `t${firstCode}`), width);
  return input;
}

async function predictorStep(predictor: Predictor, { input, cache }: Step, group: number) {
  const width = predictor.embeddings.predictorWidth();
  const outputs = await predictor.session.run({
    inputs_embeds: new ort.Tensor('float32', input, [1, input.length / width, width]),
    generation_steps: new ort.Tensor('int64', BigInt64Array.from([BigInt(group - 1)]), [1]),
    past_keys: cache.keys,
    past_values: cache.values,
  });
  return { logits: outputs.logits.data as Float32Array, cache: { keys: outputs.present_keys, values: outputs.present_values } };
}

/** Groups 1..15 of the frame whose group 0 is `firstCode`; returns the 16 codes. */
export async function predictFrame(predictor: Predictor, start: Readonly<{ hidden: Float32Array; firstCode: number }>, sampling: Sampling): Promise<number[]> {
  const { embeddings, config } = predictor;
  const vocabulary = config.code_predictor.vocab_size;
  const codes = [start.firstCode];
  let step: Step = { input: firstInput(predictor, start.hidden, start.firstCode), cache: emptyCache(predictorCacheShape(config)) };
  for (let group = 1; group < GROUPS; group++) {
    const { logits, cache } = await predictorStep(predictor, step, group);
    const code = sampleToken(logits.slice(logits.length - vocabulary), sampling);
    codes.push(code);
    const input = new Float32Array(embeddings.toPredictor(new Float32Array(embeddings.predictorCode(group - 1, code)), `${group - 1}:${code}`));
    step = { input, cache };
  }
  return codes;
}
