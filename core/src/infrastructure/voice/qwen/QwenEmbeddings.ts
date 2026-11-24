import { existsSync } from 'node:fs';
import { readNpy } from './npy.ts';
import { embeddingFile, type QwenModelConfig } from './modelConfig.ts';
import { linear, linearSilu, type LinearLayer } from './vectors.ts';

const PREDICTOR_GROUPS = 15;

function layer(folder: string, name: string): LinearLayer {
  const weights = readNpy(embeddingFile(folder, `${name}_weight.npy`));
  return { weights: weights.data, bias: readNpy(embeddingFile(folder, `${name}_bias.npy`)).data, outputs: weights.shape[0] };
}

const table = (folder: string, file: string) => readNpy(embeddingFile(folder, file)).data;

type Tables = Readonly<{
  text: Float32Array; fc1: LinearLayer; fc2: LinearLayer; codec: Float32Array; predictor: Float32Array[]; projection: LinearLayer | null;
}>;

function readTables(folder: string): Tables {
  const hasProjection = existsSync(embeddingFile(folder, 'cp_projection_weight.npy'));
  return {
    text: table(folder, 'text_embedding.npy'),
    fc1: layer(folder, 'text_projection_fc1'),
    fc2: layer(folder, 'text_projection_fc2'),
    codec: table(folder, 'talker_codec_embedding.npy'),
    predictor: Array.from({ length: PREDICTOR_GROUPS }, (_table, group) => table(folder, `cp_codec_embedding_${group}.npy`)),
    projection: hasProjection ? layer(folder, 'cp_projection') : null,
  };
}

/** The embedding tables of the export: text (through its MLP), codec group 0 and the code predictor groups 1–15. */
export class QwenEmbeddings {
  readonly #config: QwenModelConfig;
  readonly #tables: Tables;
  readonly #projected = new Map<string, Float32Array>();

  private constructor(config: QwenModelConfig, tables: Tables) {
    this.#config = config;
    this.#tables = tables;
  }

  static load(folder: string, config: QwenModelConfig): QwenEmbeddings {
    return new QwenEmbeddings(config, readTables(folder));
  }

  /** A text token (2048) through the MLP fc2(silu(fc1(x))) into the talker space (1024). */
  text(id: number): Float32Array {
    const size = this.#config.talker.text_hidden_size;
    const embedding = this.#tables.text.subarray(id * size, (id + 1) * size);
    return linear(this.#tables.fc2, linearSilu(this.#tables.fc1, embedding));
  }

  /** A talker codec token: group 0 and the control tokens. */
  codec(id: number): Float32Array {
    const size = this.#config.talker.hidden_size;
    return this.#tables.codec.subarray(id * size, (id + 1) * size);
  }

  /** A code of groups 1..15 (`group` 0 is the second group of the frame). */
  predictorCode(group: number, id: number): Float32Array {
    const size = this.#config.talker.hidden_size;
    return this.#tables.predictor[group].subarray(id * size, (id + 1) * size);
  }

  /** Only the 1.7B has the projection, and only it follows style instructions. */
  supportsInstruct(): boolean {
    return this.#tables.projection !== null;
  }

  /** The width of the code predictor input: the projection output in the 1.7B, the talker width in the 0.6B. */
  predictorWidth(): number {
    return this.#tables.projection?.outputs ?? this.#config.talker.hidden_size;
  }

  /** Talker space (2048 in the 1.7B) → code predictor space (1024); the 0.6B needs no projection. */
  toPredictor(vector: Float32Array, cacheKey?: string): Float32Array {
    const projection = this.#tables.projection;
    if (!projection) return vector;
    const cached = cacheKey === undefined ? undefined : this.#projected.get(cacheKey);
    if (cached) return cached;
    const projected = linear(projection, vector);
    if (cacheKey !== undefined) this.#projected.set(cacheKey, projected);
    return projected;
  }
}
