// Qwen3-TTS (Alibaba Qwen, Apache-2.0) rodando LOCAL em CPU, só com Node + ONNX Runtime (sem Python, sem GPU).
// Pesos: export ONNX do modelo 12Hz-0.6B-CustomVoice (huggingface.co/elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX),
// baixados uma única vez para ~/.cache/giz/ (ou GIZ_MODELS_DIR). Pipeline:
//   texto → tokens (BPE do Qwen) → talker (LM, 1 quadro de áudio a cada 80 ms, grupo 0)
//   → code predictor (grupos 1–15 do quadro) → vocoder (16 códigos/quadro → 24 kHz)
// Referência da arquitetura: github.com/QwenLM/Qwen3-TTS e github.com/elbruno/qwen-labs-cs (C#).
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as ort from 'onnxruntime-node';
import { loadConfig } from './config.ts';

export const QWEN_RATE = 24000;
export const QWEN_REPO = process.env.QWEN_TTS_REPO ?? 'elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX';
export const QWEN_SPEAKERS = ['serena', 'vivian', 'uncle_fu', 'ryan', 'aiden', 'ono_anna', 'sohee', 'eric', 'dylan'] as const;
const SAMPLES_PER_FRAME = 1920;

export function modelDir(repo = QWEN_REPO) {
  return join(loadConfig().modelsDir, repo.replace('/', '__'));
}

// ── download (uma vez, com retomada) ────────────────────────────────────────────────────────────────
export async function ensureModel(repo = QWEN_REPO): Promise<string> {
  const dir = modelDir(repo);
  const done = join(dir, '.completo');
  if (existsSync(done)) return dir;
  const tree = (await (await fetch(`https://huggingface.co/api/models/${repo}/tree/main?recursive=true`)).json()) as Array<{ type: string; path: string; size: number }>;
  const files = tree.filter((f) => f.type === 'file' && !f.path.startsWith('.') && f.path !== 'README.md');
  const total = files.reduce((s, f) => s + f.size, 0);
  console.log(`Baixando o modelo de voz Qwen3-TTS (${(total / 1e9).toFixed(1)} GB, só na primeira vez) para ${dir}`);
  let got = 0;
  for (const f of files) {
    const dst = join(dir, f.path);
    mkdirSync(dirname(dst), { recursive: true });
    if (existsSync(dst) && statSync(dst).size === f.size) { got += f.size; continue; }
    const part = `${dst}.part`;
    const have = existsSync(part) ? statSync(part).size : 0;
    const res = await fetch(`https://huggingface.co/${repo}/resolve/main/${f.path}`, { headers: have ? { Range: `bytes=${have}-` } : {} });
    if (!res.ok || !res.body) throw new Error(`falha ao baixar ${f.path}: HTTP ${res.status}`);
    const append = have > 0 && res.status === 206;
    await pipeline(Readable.fromWeb(res.body as never), createWriteStream(part, { flags: append ? 'a' : 'w' }));
    if (statSync(part).size !== f.size) throw new Error(`download incompleto de ${f.path}; rode de novo para retomar`);
    renameSync(part, dst);
    got += f.size;
    process.stdout.write(`  ${(got / 1e9).toFixed(2)}/${(total / 1e9).toFixed(1)} GB  ${f.path}\n`);
  }
  (await import('node:fs')).writeFileSync(done, new Date().toISOString());
  return dir;
}

// ── .npy (float32, little-endian, C-order) ───────────────────────────────────────────────────────
function readNpy(path: string): { data: Float32Array; shape: number[] } {
  const buf = readFileSync(path);
  const major = buf[6]; // \x93NUMPY, versão maior/menor, tamanho do cabeçalho (2 bytes na v1, 4 na v2+)
  const hlen = major === 1 ? buf.readUInt16LE(8) : buf.readUInt32LE(8);
  const off = major === 1 ? 10 : 12;
  const header = buf.toString('latin1', off, off + hlen);
  if (!header.includes("'<f4'")) throw new Error(`${path}: esperado float32 (<f4)`);
  if (header.includes("'fortran_order': True")) throw new Error(`${path}: fortran_order não suportado`);
  const shape = header.match(/'shape':\s*\(([^)]*)\)/)![1].split(',').map((s) => s.trim()).filter(Boolean).map(Number);
  const start = off + hlen;
  const data = new Float32Array(buf.buffer.slice(buf.byteOffset + start, buf.byteOffset + buf.length));
  return { data, shape };
}

// ── tokenizador BPE em nível de byte (Qwen2) ─────────────────────────────────────────────────────
class BpeTokenizer {
  private vocab: Map<string, number>;
  private ranks = new Map<string, number>();
  private byteMap: string[] = [];
  private cache = new Map<string, number[]>();
  static SPECIAL: Record<string, number> = { '<|endoftext|>': 151643, '<|im_start|>': 151644, '<|im_end|>': 151645 };
  // pré-tokenização do Qwen2 (dígitos um a um); (?i:) reescrito porque o V8 do Node 22 não tem modificadores inline
  private static PAT = /'(?:[sS]|[tT]|[rR][eE]|[vV][eE]|[mM]|[lL][lL]|[dD])|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;

  constructor(dir: string) {
    this.vocab = new Map(Object.entries(JSON.parse(readFileSync(join(dir, 'vocab.json'), 'utf8')) as Record<string, number>));
    readFileSync(join(dir, 'merges.txt'), 'utf8').split('\n').forEach((l, i) => { if (l && !l.startsWith('#version')) this.ranks.set(l, i); });
    // bytes_to_unicode do GPT-2
    const bs: number[] = [];
    for (let b = 33; b <= 126; b++) bs.push(b);
    for (let b = 161; b <= 172; b++) bs.push(b);
    for (let b = 174; b <= 255; b++) bs.push(b);
    const cs = [...bs];
    let n = 0;
    for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n++); }
    bs.forEach((b, i) => { this.byteMap[b] = String.fromCodePoint(cs[i]); });
  }

  private bpe(word: string): number[] {
    const hit = this.cache.get(word);
    if (hit) return hit;
    let parts = [...word];
    while (parts.length > 1) {
      let best = -1, bestRank = Infinity;
      for (let i = 0; i < parts.length - 1; i++) {
        const r = this.ranks.get(`${parts[i]} ${parts[i + 1]}`);
        if (r !== undefined && r < bestRank) { bestRank = r; best = i; }
      }
      if (best < 0) break;
      parts = [...parts.slice(0, best), parts[best] + parts[best + 1], ...parts.slice(best + 2)];
    }
    const ids = parts.map((p) => {
      const id = this.vocab.get(p);
      if (id === undefined) throw new Error(`token fora do vocabulário: ${JSON.stringify(p)}`);
      return id;
    });
    this.cache.set(word, ids);
    return ids;
  }

  encode(text: string): number[] {
    const out: number[] = [];
    const specials = new RegExp(`(${Object.keys(BpeTokenizer.SPECIAL).map((s) => s.replace(/[|]/g, '\\|')).join('|')})`);
    for (const chunk of text.normalize('NFC').split(specials)) {
      if (!chunk) continue;
      if (chunk in BpeTokenizer.SPECIAL) { out.push(BpeTokenizer.SPECIAL[chunk]); continue; }
      for (const m of chunk.matchAll(BpeTokenizer.PAT)) {
        const bytes = new TextEncoder().encode(m[0]);
        out.push(...this.bpe([...bytes].map((b) => this.byteMap[b]).join('')));
      }
    }
    return out;
  }
}

// ── PRNG com semente: a mesma fala gera sempre o mesmo áudio ─────────────────────────────────────
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function sample(logits: Float32Array, temperature: number, topK: number, rand: () => number): number {
  const n = logits.length;
  const idx = Array.from({ length: n }, (_, i) => i).filter((i) => Number.isFinite(logits[i]));
  idx.sort((a, b) => logits[b] - logits[a]);
  const keep = idx.slice(0, Math.min(topK, idx.length));
  if (temperature <= 0) return keep[0];
  const max = logits[keep[0]] / temperature;
  const p = keep.map((i) => Math.exp(logits[i] / temperature - max));
  const sum = p.reduce((s, v) => s + v, 0);
  let r = rand() * sum;
  for (let k = 0; k < keep.length; k++) { r -= p[k]; if (r <= 0) return keep[k]; }
  return keep[keep.length - 1];
}

type Config = {
  talker: { hidden_size: number; text_hidden_size: number; vocab_size: number; num_hidden_layers: number; num_key_value_heads: number; head_dim: number;
    codec_eos_token_id: number; codec_think_id: number; codec_nothink_id: number; codec_think_bos_id: number; codec_think_eos_id: number; codec_pad_id: number; codec_bos_id: number };
  code_predictor: { hidden_size: number; vocab_size: number; num_hidden_layers: number; num_key_value_heads: number; head_dim: number };
  tts: { tts_bos_token_id: number; tts_eos_token_id: number; tts_pad_token_id: number };
  language_ids: Record<string, number>;
};

export type GenerateOptions = { speaker: string; language?: string; seed?: number; temperature?: number; topK?: number; repetitionPenalty?: number; maxFrames?: number };

export class Qwen3TTS {
  // campos atribuídos no construtor (Node só remove tipos: sem "parameter properties")
  private cfg!: Config;
  private tok!: BpeTokenizer;
  private speakers!: Record<string, number>;
  private textEmb!: Float32Array;
  private fc1!: { w: Float32Array; b: Float32Array; out: number };
  private fc2!: { w: Float32Array; b: Float32Array; out: number };
  private codecEmb!: Float32Array; // talker: grupo 0 e tokens de controle (vocab_size × hidden)
  private cpEmb!: Float32Array[]; // grupos 1..15 (cp_vocab × cp_hidden)
  private prefill!: ort.InferenceSession;
  private decode!: ort.InferenceSession;
  private cp!: ort.InferenceSession;
  private vocoder!: ort.InferenceSession;
  private constructor(parts: Record<string, unknown>) { Object.assign(this, parts); }

  static async load(dir?: string): Promise<Qwen3TTS> {
    dir ??= await ensureModel();
    const e = (f: string) => join(dir!, 'embeddings', f);
    const cfg = JSON.parse(readFileSync(e('config.json'), 'utf8')) as Config;
    if (cfg.code_predictor.hidden_size !== cfg.talker.hidden_size) throw new Error('modelo 1.7B (com projeção do code predictor) ainda não suportado; use o 0.6B');
    const fc1w = readNpy(e('text_projection_fc1_weight.npy')), fc2w = readNpy(e('text_projection_fc2_weight.npy'));
    const cfg0 = loadConfig();
    if (cfg0.device === 'cuda') (await import('./gpu.ts')).preloadCuda();
    const opts: ort.InferenceSession.SessionOptions = {
      graphOptimizationLevel: 'all', executionMode: 'sequential', logSeverityLevel: 3,
      intraOpNumThreads: cfg0.threads, interOpNumThreads: 1,
      executionProviders: cfg0.device === 'cuda' ? [{ name: 'cuda', deviceId: 0 }, 'cpu'] : ['cpu'],
    };
    const s = (f: string) => ort.InferenceSession.create(join(dir!, f), opts);
    // o vocoder roda sempre na CPU: na GPU, o nó Pad dele falha com formas dinâmicas (problema conhecido do export)
    const [prefill, decode, cp, vocoder] = await Promise.all([s('talker_prefill.onnx'), s('talker_decode.onnx'), s('code_predictor.onnx'),
      ort.InferenceSession.create(join(dir!, 'vocoder.onnx'), { ...opts, executionProviders: ['cpu'] })]);
    return new Qwen3TTS({
      cfg, tok: new BpeTokenizer(join(dir, 'tokenizer')), speakers: JSON.parse(readFileSync(e('speaker_ids.json'), 'utf8')),
      textEmb: readNpy(e('text_embedding.npy')).data,
      fc1: { w: fc1w.data, b: readNpy(e('text_projection_fc1_bias.npy')).data, out: fc1w.shape[0] },
      fc2: { w: fc2w.data, b: readNpy(e('text_projection_fc2_bias.npy')).data, out: fc2w.shape[0] },
      codecEmb: readNpy(e('talker_codec_embedding.npy')).data,
      cpEmb: Array.from({ length: 15 }, (_, g) => readNpy(e(`cp_codec_embedding_${g}.npy`)).data),
      prefill, decode, cp, vocoder,
    });
  }

  get availableSpeakers() { return Object.keys(this.speakers); }

  // texto (2048) → MLP fc2(silu(fc1(x))) → espaço do talker (1024)
  private textVec(id: number): Float32Array {
    const D = this.cfg.talker.text_hidden_size;
    const x = this.textEmb.subarray(id * D, (id + 1) * D);
    const h = new Float32Array(this.fc1.out);
    for (let o = 0; o < this.fc1.out; o++) {
      let s = this.fc1.b[o]; const row = o * D;
      for (let i = 0; i < D; i++) s += this.fc1.w[row + i] * x[i];
      h[o] = s / (1 + Math.exp(-s));
    }
    const y = new Float32Array(this.fc2.out);
    for (let o = 0; o < this.fc2.out; o++) {
      let s = this.fc2.b[o]; const row = o * this.fc1.out;
      for (let i = 0; i < this.fc1.out; i++) s += this.fc2.w[row + i] * h[i];
      y[o] = s;
    }
    return y;
  }
  private codecVec(id: number) { const H = this.cfg.talker.hidden_size; return this.codecEmb.subarray(id * H, (id + 1) * H); }
  private cpVec(group: number, id: number) { const H = this.cfg.code_predictor.hidden_size; return this.cpEmb[group].subarray(id * H, (id + 1) * H); }
  private static add(...v: ArrayLike<number>[]) { const o = new Float32Array(v[0].length); for (const a of v) for (let i = 0; i < o.length; i++) o[i] += a[i]; return o; }

  async generate(text: string, o: GenerateOptions): Promise<Float32Array> {
    const { talker: T, tts } = this.cfg;
    const H = T.hidden_size;
    const rand = rng(o.seed ?? 1);
    const temperature = o.temperature ?? 0.9, topK = o.topK ?? 50, rep = o.repetitionPenalty ?? 1.05;
    const spk = this.speakers[o.speaker.toLowerCase()];
    if (spk === undefined) throw new Error(`voz "${o.speaker}" não existe; disponíveis: ${this.availableSpeakers.join(', ')}`);
    const lang = (o.language ?? 'portuguese').toLowerCase();

    const ids = this.tok.encode(`<|im_start|>assistant\n${text}<|im_end|>\n<|im_start|>assistant\n`);
    const ttsPad = this.textVec(tts.tts_pad_token_id), ttsBos = this.textVec(tts.tts_bos_token_id), ttsEos = this.textVec(tts.tts_eos_token_id);

    // prefixo: papel (3 tokens) + controle do codec (idioma, voz) + 1º token do texto
    const codec = lang === 'auto'
      ? [T.codec_nothink_id, T.codec_think_bos_id, T.codec_think_eos_id]
      : [T.codec_think_id, T.codec_think_bos_id, this.cfg.language_ids[lang] ?? (() => { throw new Error(`idioma "${lang}" não suportado`); })(), T.codec_think_eos_id];
    codec.push(spk, T.codec_pad_id, T.codec_bos_id);
    const rows: Float32Array[] = [0, 1, 2].map((i) => this.textVec(ids[i]));
    for (let i = 0; i < codec.length - 2; i++) rows.push(Qwen3TTS.add(ttsPad, this.codecVec(codec[i])));
    rows.push(Qwen3TTS.add(ttsBos, this.codecVec(codec[codec.length - 2])));
    rows.push(Qwen3TTS.add(this.textVec(ids[3]), this.codecVec(T.codec_bos_id)));
    // o resto do texto entra um token por quadro gerado, depois tts_eos e tts_pad
    const trailing = ids.slice(4, ids.length - 5).map((id) => this.textVec(id));
    trailing.push(ttsEos);

    const L = rows.length;
    const embeds = new Float32Array(L * H);
    rows.forEach((r, i) => embeds.set(r, i * H));
    const pos = new BigInt64Array(3 * L);
    for (let a = 0; a < 3; a++) for (let i = 0; i < L; i++) pos[a * L + i] = BigInt(i);
    const pre = await this.prefill.run({
      inputs_embeds: new ort.Tensor('float32', embeds, [1, L, H]),
      attention_mask: new ort.Tensor('int64', new BigInt64Array(L).fill(1n), [1, L]),
      position_ids: new ort.Tensor('int64', pos, [3, 1, L]),
    });
    // KV do prefill vem por camada; o decode quer tudo empilhado (camadas, 1, kv, T, hd)
    const NL = T.num_hidden_layers, layer = T.num_key_value_heads * L * T.head_dim;
    const keys = new Float32Array(NL * layer), vals = new Float32Array(NL * layer);
    for (let l = 0; l < NL; l++) {
      keys.set(pre[`present_key_${l}`].data as Float32Array, l * layer);
      vals.set(pre[`present_value_${l}`].data as Float32Array, l * layer);
    }
    let pastK: ort.Tensor = new ort.Tensor('float32', keys, [NL, 1, T.num_key_value_heads, L, T.head_dim]);
    let pastV: ort.Tensor = new ort.Tensor('float32', vals, [NL, 1, T.num_key_value_heads, L, T.head_dim]);
    let logits = pre.logits.data as Float32Array;
    let hidden = pre.hidden_states.data as Float32Array;

    const CP = this.cfg.code_predictor;
    const frames: number[][] = [];
    const history: number[] = [];
    const maxFrames = o.maxFrames ?? Math.max(60, ids.length * 12);
    const emptyCp = () => new ort.Tensor('float32', new Float32Array(0), [CP.num_hidden_layers, 1, CP.num_key_value_heads, 0, CP.head_dim]);
    for (let step = 0; step < maxFrames; step++) {
      const l0 = logits.slice(logits.length - T.vocab_size);
      for (const t of history) l0[t] = l0[t] > 0 ? l0[t] / rep : l0[t] * rep;
      for (let i = CP.vocab_size; i < T.vocab_size; i++) if (i !== T.codec_eos_token_id) l0[i] = -Infinity;
      if (step < 2) l0[T.codec_eos_token_id] = -Infinity;
      const g0 = sample(l0, temperature, topK, rand);
      if (g0 === T.codec_eos_token_id) break;
      history.push(g0);

      // grupos 1..15 do mesmo quadro
      const codes = [g0];
      let cpIn = new Float32Array(2 * H);
      cpIn.set(hidden.subarray(hidden.length - H), 0);
      cpIn.set(this.codecVec(g0), H);
      let cpK: ort.Tensor = emptyCp(), cpV: ort.Tensor = emptyCp();
      for (let g = 1; g < 16; g++) {
        const seq = g === 1 ? 2 : 1;
        const out = await this.cp.run({
          inputs_embeds: new ort.Tensor('float32', cpIn, [1, seq, H]),
          generation_steps: new ort.Tensor('int64', BigInt64Array.from([BigInt(g - 1)]), [1]),
          past_keys: cpK, past_values: cpV,
        });
        const cl = out.logits.data as Float32Array;
        const c = sample(cl.slice(cl.length - CP.vocab_size), temperature, topK, rand);
        codes.push(c);
        cpK = out.present_keys; cpV = out.present_values;
        cpIn = new Float32Array(this.cpVec(g - 1, c));
      }
      frames.push(codes);

      // próxima entrada do talker: soma das 16 embeddings + próximo token de texto (ou tts_pad)
      const next = new Float32Array(this.codecVec(g0));
      for (let g = 1; g < 16; g++) { const v = this.cpVec(g - 1, codes[g]); for (let i = 0; i < H; i++) next[i] += v[i]; }
      const tv = step < trailing.length ? trailing[step] : ttsPad;
      for (let i = 0; i < H; i++) next[i] += tv[i];
      const len = L + step + 1;
      const p = BigInt(L + step);
      const dec = await this.decode.run({
        inputs_embeds: new ort.Tensor('float32', next, [1, 1, H]),
        attention_mask: new ort.Tensor('int64', new BigInt64Array(len).fill(1n), [1, len]),
        position_ids: new ort.Tensor('int64', BigInt64Array.from([p, p, p]), [3, 1, 1]),
        past_keys: pastK, past_values: pastV,
      });
      logits = dec.logits.data as Float32Array;
      hidden = dec.hidden_states.data as Float32Array;
      pastK = dec.present_keys; pastV = dec.present_values;
    }
    if (!frames.length) return new Float32Array(0);

    const N = frames.length;
    const flat = new BigInt64Array(16 * N);
    for (let t = 0; t < N; t++) for (let g = 0; g < 16; g++) flat[g * N + t] = BigInt(frames[t][g]);
    const wav = await this.vocoder.run({ [this.vocoder.inputNames[0]]: new ort.Tensor('int64', flat, [1, 16, N]) });
    const audio = wav[this.vocoder.outputNames[0]].data as Float32Array;
    if (audio.length !== N * SAMPLES_PER_FRAME) console.warn(`aviso: vocoder devolveu ${audio.length} amostras (esperado ${N * SAMPLES_PER_FRAME})`);
    return audio;
  }
}

// teste rápido: node scripts/qwen3-tts.ts "Olá, tudo bem?" serena saida.wav
if (process.argv[1] === import.meta.filename) {
  const [text = 'Olá! Eu sou a Lia.', speaker = 'serena', out = 'qwen-teste.wav'] = process.argv.slice(2);
  const t0 = performance.now();
  const tts = await Qwen3TTS.load();
  console.log(`modelo carregado em ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  const t1 = performance.now();
  const a = await tts.generate(text, { speaker, seed: 7 });
  const secs = (performance.now() - t1) / 1000;
  const buf = Buffer.alloc(44 + a.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + a.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(QWEN_RATE, 24);
  buf.writeUInt32LE(QWEN_RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(a.length * 2, 40);
  a.forEach((s, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  (await import('node:fs')).writeFileSync(out, buf);
  console.log(`${out}: ${(a.length / QWEN_RATE).toFixed(2)} s de áudio em ${secs.toFixed(1)} s`);
}
