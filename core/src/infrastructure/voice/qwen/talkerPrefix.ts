import type { BpeTokenizer } from './BpeTokenizer.ts';
import type { QwenEmbeddings } from './QwenEmbeddings.ts';
import type { QwenModelConfig } from './modelConfig.ts';
import { sum } from './vectors.ts';

export type PrefixRequest = Readonly<{ text: string; speaker: number; language: string; instruct?: string }>;
/** `rows`: the prefix positions; `trailing`: the rest of the text, one token per generated frame; `tokens`: text length. */
export type Prefix = Readonly<{ rows: Float32Array[]; trailing: Float32Array[]; pad: Float32Array; tokens: number }>;
type Parts = Readonly<{ tokenizer: BpeTokenizer; embeddings: QwenEmbeddings; config: QwenModelConfig }>;

// Codec control: thinking (language) or not ("auto"), then the speaker, pad and bos.
function controlCodes({ talker, language_ids: languages }: QwenModelConfig, request: PrefixRequest): number[] {
  const tail = [request.speaker, talker.codec_pad_id, talker.codec_bos_id];
  if (request.language === 'auto') return [talker.codec_nothink_id, talker.codec_think_bos_id, talker.codec_think_eos_id, ...tail];
  const language = languages[request.language];
  if (language === undefined) throw new Error(`idioma "${request.language}" não suportado`);
  return [talker.codec_think_id, talker.codec_think_bos_id, language, talker.codec_think_eos_id, ...tail];
}

// Style instruction (1.7B only): a "user" turn before everything, text only (no codec).
function instructionRows({ tokenizer, embeddings }: Parts, instruct: string | undefined): Float32Array[] {
  if (!instruct || !embeddings.supportsInstruct()) return [];
  return tokenizer.encode(`<|im_start|>user\n${instruct}<|im_end|>\n`).map((id) => embeddings.text(id));
}

/** Role (3 tokens) + codec control (language, voice) + the first text token; the rest of the text trails. */
export function talkerPrefix(parts: Parts, request: PrefixRequest): Prefix {
  const { tokenizer, embeddings, config } = parts;
  const ids = tokenizer.encode(`<|im_start|>assistant\n${request.text}<|im_end|>\n<|im_start|>assistant\n`);
  const [pad, bos, eos] = [config.tts.tts_pad_token_id, config.tts.tts_bos_token_id, config.tts.tts_eos_token_id].map((id) => embeddings.text(id));
  const codes = controlCodes(config, request);
  const rows = [
    ...instructionRows(parts, request.instruct),
    ...ids.slice(0, 3).map((id) => embeddings.text(id)),
    ...codes.slice(0, -2).map((code) => sum(pad, embeddings.codec(code))),
    sum(bos, embeddings.codec(codes[codes.length - 2])),
    sum(embeddings.text(ids[3]), embeddings.codec(config.talker.codec_bos_id)),
  ];
  const trailing = [...ids.slice(4, ids.length - 5).map((id) => embeddings.text(id)), eos];
  return { rows, trailing, pad, tokens: ids.length };
}
