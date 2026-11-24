import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Byte-level BPE tokenizer of Qwen2 (vocab.json + merges.txt of the model's tokenizer/ folder).
const SPECIAL_TOKENS: Readonly<Record<string, number>> = { '<|endoftext|>': 151643, '<|im_start|>': 151644, '<|im_end|>': 151645 };
const SPECIAL_SPLIT = new RegExp(`(${Object.keys(SPECIAL_TOKENS).map((token) => token.replace(/[|]/g, '\\|')).join('|')})`);
// Qwen2 pre-tokenization (digits one by one); (?i:) is spelled out because Node 22's V8 has no inline modifiers.
const PRE_TOKENIZATION = /'(?:[sS]|[tT]|[rR][eE]|[vV][eE]|[mM]|[lL][lL]|[dD])|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_value, offset) => from + offset);

// GPT-2 bytes_to_unicode: every byte as a printable character.
function byteCharacters(): string[] {
  const printable = [...range(33, 126), ...range(161, 172), ...range(174, 255)];
  const others = range(0, 255).filter((byte) => !printable.includes(byte));
  const characters: string[] = [];
  printable.forEach((byte) => (characters[byte] = String.fromCodePoint(byte)));
  others.forEach((byte, index) => (characters[byte] = String.fromCodePoint(256 + index)));
  return characters;
}

function mergeRanks(folder: string): Map<string, number> {
  const ranks = new Map<string, number>();
  const lines = readFileSync(join(folder, 'merges.txt'), 'utf8').split('\n');
  lines.forEach((line, index) => line && !line.startsWith('#version') && ranks.set(line, index));
  return ranks;
}

type Pair = Readonly<{ index: number; rank: number }>;

// The adjacent pair with the lowest merge rank (the first one on ties), or -1 when no pair merges any more.
function bestPair(parts: readonly string[], ranks: ReadonlyMap<string, number>): number {
  const pairs = parts.slice(1).map((part, index): Pair => ({ index, rank: ranks.get(`${parts[index]} ${part}`) ?? Infinity }));
  const best = pairs.reduce<Pair>((lowest, pair) => (pair.rank < lowest.rank ? pair : lowest), { index: -1, rank: Infinity });
  return best.index;
}

export class BpeTokenizer {
  readonly #vocabulary: Map<string, number>;
  readonly #ranks: Map<string, number>;
  readonly #bytes = byteCharacters();
  readonly #cache = new Map<string, number[]>();

  constructor(folder: string) {
    const vocabulary = JSON.parse(readFileSync(join(folder, 'vocab.json'), 'utf8')) as Record<string, number>;
    this.#vocabulary = new Map(Object.entries(vocabulary));
    this.#ranks = mergeRanks(folder);
  }

  encode(text: string): number[] {
    const chunks = text.normalize('NFC').split(SPECIAL_SPLIT).filter(Boolean);
    return chunks.flatMap((chunk) => (Object.hasOwn(SPECIAL_TOKENS, chunk) ? [SPECIAL_TOKENS[chunk]] : this.#encodeChunk(chunk)));
  }

  #encodeChunk(chunk: string): number[] {
    const pieces = [...chunk.matchAll(PRE_TOKENIZATION)].map((match) => match[0]);
    return pieces.flatMap((piece) => this.#bpe([...new TextEncoder().encode(piece)].map((byte) => this.#bytes[byte]).join('')));
  }

  #bpe(word: string): number[] {
    const cached = this.#cache.get(word);
    if (cached) return cached;
    let parts = [...word];
    for (let pair = bestPair(parts, this.#ranks); pair >= 0; pair = bestPair(parts, this.#ranks)) {
      parts = [...parts.slice(0, pair), parts[pair] + parts[pair + 1], ...parts.slice(pair + 2)];
    }
    const ids = parts.map((part) => this.#idOf(part));
    this.#cache.set(word, ids);
    return ids;
  }

  #idOf(part: string): number {
    const id = this.#vocabulary.get(part);
    if (id === undefined) throw new Error(`token fora do vocabulário: ${JSON.stringify(part)}`);
    return id;
  }
}
