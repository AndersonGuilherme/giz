// Qwen3-TTS (Alibaba Qwen, Apache-2.0) rodando LOCAL (CPU ou GPU NVIDIA), só com Node + ONNX Runtime (sem Python).
// Pesos: export ONNX dos modelos 12Hz CustomVoice 0.6B ou 1.7B (huggingface.co/elbruno/Qwen3-TTS-12Hz-*-CustomVoice-ONNX),
// baixados uma única vez para <modelsDir> (giz.config.json). O 1.7B aceita instruções de estilo ("fale empolgado"). Pipeline:
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
export const QWEN_MODELS = {
  '0.6b': { repo: 'elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX', gb: 5.9, instruct: false },
  '1.7b': { repo: 'elbruno/Qwen3-TTS-12Hz-1.7B-CustomVoice-ONNX', gb: 13.4, instruct: true },
} as const;
export type QwenModel = keyof typeof QWEN_MODELS;
export const configuredRepo = () => process.env.QWEN_TTS_REPO ?? QWEN_MODELS[loadConfig().model].repo;
export const QWEN_SPEAKERS = ['serena', 'vivian', 'uncle_fu', 'ryan', 'aiden', 'ono_anna', 'sohee', 'eric', 'dylan'] as const;
const SAMPLES_PER_FRAME = 1920;

export function modelDir(repo = configuredRepo()) {
  return join(loadConfig().modelsDir, repo.replace('/', '__'));
}

// ── download (uma vez, com retomada) ────────────────────────────────────────────────────────────────
export async function ensureModel(repo = configuredRepo()): Promise<string> {
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
export class BpeTokenizer {
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

// QWEN_PROFILE=1 imprime onde o tempo de cada geração foi gasto
const PROF = process.env.QWEN_PROFILE ? new Map<string, number>() : null;
async function timed<T>(k: string, f: () => Promise<T> | T): Promise<T> {
  if (!PROF) return f();
  const t = performance.now(); const r = await f(); PROF.set(k, (PROF.get(k) ?? 0) + performance.now() - t); return r;
}

export type GenerateOptions = { speaker: string; language?: string; instruct?: string; seed?: number; temperature?: number; topK?: number; repetitionPenalty?: number; maxFrames?: number };

export class Qwen3TTS {
  // campos atribuídos no construtor (Node só remove tipos: sem "parameter properties")
  private cfg!: Config;
  private tok!: BpeTokenizer;
  private speakers!: Record<string, number>;
  private textEmb!: Float32Array;
  private fc1!: { w: Float32Array; b: Float32Array; out: number };
  private fc2!: { w: Float32Array; b: Float32Array; out: number };
  private codecEmb!: Float32Array; // talker: grupo 0 e tokens de controle (vocab_size × hidden)
  private cpEmb!: Float32Array[]; // grupos 1..15 (cp_vocab × hidden do talker)
  private cpProj!: { w: Float32Array; b: Float32Array; out: number } | null; // 1.7B: talker (2048) → code predictor (1024)
  private projCache = new Map<string, Float32Array>();
  private prefill!: ort.InferenceSession | null; // null: prefill feito pelo próprio decode (economiza a 2ª cópia dos pesos)
  private decode!: ort.InferenceSession;
  private cp!: ort.InferenceSession;
  private vocoder!: ort.InferenceSession;
  private vocoderPath!: string;
  private cpuOpts!: ort.InferenceSession.SessionOptions;
  private vocoderCpu: ort.InferenceSession | null = null;
  private async vocode(codes: ort.Tensor): Promise<Float32Array> {
    const run = async (v: ort.InferenceSession) => (await v.run({ [v.inputNames[0]]: codes }))[v.outputNames[0]].data as Float32Array;
    if (this.vocoderCpu) return run(this.vocoderCpu);
    try { return await run(this.vocoder); } catch (e) {
      if (!/Pad|shape/i.test(String((e as Error).message))) throw e;
      this.vocoderCpu = await ort.InferenceSession.create(this.vocoderPath, this.cpuOpts);
      return run(this.vocoderCpu);
    }
  }
  private constructor(parts: Record<string, unknown>) { Object.assign(this, parts); }

  static async load(dir?: string): Promise<Qwen3TTS> {
    dir ??= await ensureModel();
    const e = (f: string) => join(dir!, 'embeddings', f);
    const cfg = JSON.parse(readFileSync(e('config.json'), 'utf8')) as Config;
    const fc1w = readNpy(e('text_projection_fc1_weight.npy')), fc2w = readNpy(e('text_projection_fc2_weight.npy'));
    const cfg0 = loadConfig();
    if (cfg0.device === 'cuda') (await import('./gpu.ts')).preloadCuda();
    const opts: ort.InferenceSession.SessionOptions = {
      graphOptimizationLevel: 'all', executionMode: 'sequential', logSeverityLevel: 3,
      intraOpNumThreads: cfg0.threads, interOpNumThreads: 1,
      executionProviders: cfg0.device === 'cuda' ? [{ name: 'cuda', deviceId: 0 }, 'cpu'] : ['cpu'],
    };
    const s = (f: string) => ort.InferenceSession.create(join(dir!, f), opts);
    // vocoder: tenta a GPU; se o nó Pad falhar com alguma forma (problema conhecido do export), refaz na CPU
    // QWEN_PREFILL=1 usa o grafo de prefill separado (mais memória: os pesos do talker ficam carregados duas vezes)
    const [prefill, decode, cp, vocoder] = await Promise.all([process.env.QWEN_PREFILL ? s('talker_prefill.onnx') : null, s('talker_decode.onnx'), s('code_predictor.onnx'),
      ort.InferenceSession.create(join(dir!, 'vocoder.onnx'), { ...opts, logSeverityLevel: 4 })]); // 4: a falha esperada do Pad não polui o terminal
    return new Qwen3TTS({
      cfg, tok: new BpeTokenizer(join(dir, 'tokenizer')), speakers: JSON.parse(readFileSync(e('speaker_ids.json'), 'utf8')),
      textEmb: readNpy(e('text_embedding.npy')).data,
      fc1: { w: fc1w.data, b: readNpy(e('text_projection_fc1_bias.npy')).data, out: fc1w.shape[0] },
      fc2: { w: fc2w.data, b: readNpy(e('text_projection_fc2_bias.npy')).data, out: fc2w.shape[0] },
      codecEmb: readNpy(e('talker_codec_embedding.npy')).data,
      cpEmb: Array.from({ length: 15 }, (_, g) => readNpy(e(`cp_codec_embedding_${g}.npy`)).data),
      cpProj: existsSync(e('cp_projection_weight.npy'))
        ? (() => { const w = readNpy(e('cp_projection_weight.npy')); return { w: w.data, b: readNpy(e('cp_projection_bias.npy')).data, out: w.shape[0] }; })()
        : null,
      prefill, decode, cp, vocoder, vocoderPath: join(dir, 'vocoder.onnx'), cpuOpts: { ...opts, executionProviders: ['cpu'] },
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
  private cpVec(group: number, id: number) { const H = this.cfg.talker.hidden_size; return this.cpEmb[group].subarray(id * H, (id + 1) * H); }
  get supportsInstruct() { return this.cpProj !== null; }
  // entrada do code predictor: no 1.7B, projeta do espaço do talker (2048) para o do code predictor (1024)
  private toCp(v: Float32Array, cacheKey?: string): Float32Array {
    const P = this.cpProj;
    if (!P) return v;
    if (cacheKey) { const hit = this.projCache.get(cacheKey); if (hit) return hit; }
    const D = v.length, y = new Float32Array(P.out);
    for (let o = 0; o < P.out; o++) { let s = P.b[o]; const row = o * D; for (let i = 0; i < D; i++) s += P.w[row + i] * v[i]; y[o] = s; }
    if (cacheKey) this.projCache.set(cacheKey, y);
    return y;
  }
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
    const rows: Float32Array[] = [];
    // instrução de estilo (só 1.7B): turno "user" antes de tudo, só texto (sem codec)
    if (o.instruct && this.supportsInstruct) for (const id of this.tok.encode(`<|im_start|>user\n${o.instruct}<|im_end|>\n`)) rows.push(this.textVec(id));
    rows.push(...[0, 1, 2].map((i) => this.textVec(ids[i])));
    for (let i = 0; i < codec.length - 2; i++) rows.push(Qwen3TTS.add(ttsPad, this.codecVec(codec[i])));
    rows.push(Qwen3TTS.add(ttsBos, this.codecVec(codec[codec.length - 2])));
    rows.push(Qwen3TTS.add(this.textVec(ids[3]), this.codecVec(T.codec_bos_id)));
    // o resto do texto entra um token por quadro gerado, depois tts_eos e tts_pad
    const trailing = ids.slice(4, ids.length - 5).map((id) => this.textVec(id));
    trailing.push(ttsEos);

    const L = rows.length;
    const embeds = new Float32Array(L * H);
    rows.forEach((r, i) => embeds.set(r, i * H));
    const NL = T.num_hidden_layers, KV = T.num_key_value_heads, HD = T.head_dim;
    let pastK: ort.Tensor, pastV: ort.Tensor, logits: Float32Array, hidden: Float32Array;
    if (this.prefill) {
      const pos = new BigInt64Array(3 * L);
      for (let a = 0; a < 3; a++) for (let i = 0; i < L; i++) pos[a * L + i] = BigInt(i);
      const pre = await timed('prefill', () => this.prefill!.run({
        inputs_embeds: new ort.Tensor('float32', embeds, [1, L, H]),
        attention_mask: new ort.Tensor('int64', new BigInt64Array(L).fill(1n), [1, L]),
        position_ids: new ort.Tensor('int64', pos, [3, 1, L]),
      }));
      // KV do prefill vem por camada; o decode quer tudo empilhado (camadas, 1, kv, T, hd)
      const layer = KV * L * HD;
      const keys = new Float32Array(NL * layer), vals = new Float32Array(NL * layer);
      for (let l = 0; l < NL; l++) {
        keys.set(pre[`present_key_${l}`].data as Float32Array, l * layer);
        vals.set(pre[`present_value_${l}`].data as Float32Array, l * layer);
      }
      pastK = new ort.Tensor('float32', keys, [NL, 1, KV, L, HD]);
      pastV = new ort.Tensor('float32', vals, [NL, 1, KV, L, HD]);
      logits = pre.logits.data as Float32Array;
      hidden = pre.hidden_states.data as Float32Array;
    } else {
      // prefill com o grafo de decode, uma posição por vez (mesmo resultado, metade da memória)
      pastK = new ort.Tensor('float32', new Float32Array(0), [NL, 1, KV, 0, HD]);
      pastV = new ort.Tensor('float32', new Float32Array(0), [NL, 1, KV, 0, HD]);
      let out!: ort.InferenceSession.OnnxValueMapType;
      for (let i = 0; i < L; i++) {
        const p = BigInt(i);
        out = await timed('prefill', () => this.decode.run({
          inputs_embeds: new ort.Tensor('float32', embeds.subarray(i * H, (i + 1) * H), [1, 1, H]),
          attention_mask: new ort.Tensor('int64', new BigInt64Array(i + 1).fill(1n), [1, i + 1]),
          position_ids: new ort.Tensor('int64', BigInt64Array.from([p, p, p]), [3, 1, 1]),
          past_keys: pastK, past_values: pastV,
        }));
        pastK = out.present_keys; pastV = out.present_values;
      }
      logits = out.logits.data as Float32Array;
      hidden = out.hidden_states.data as Float32Array;
    }

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
      const g0 = await timed('sample', () => sample(l0, temperature, topK, rand));
      if (g0 === T.codec_eos_token_id) break;
      history.push(g0);

      // grupos 1..15 do mesmo quadro
      const codes = [g0];
      const CH = this.cpProj ? this.cpProj.out : H;
      let cpIn = new Float32Array(2 * CH);
      await timed('proj', () => { cpIn.set(this.toCp(hidden.slice(hidden.length - H)), 0); cpIn.set(this.toCp(new Float32Array(this.codecVec(g0)), `t${g0}`), CH); });
      let cpK: ort.Tensor = emptyCp(), cpV: ort.Tensor = emptyCp();
      for (let g = 1; g < 16; g++) {
        const seq = g === 1 ? 2 : 1;
        const out = await timed('code_predictor', () => this.cp.run({
          inputs_embeds: new ort.Tensor('float32', cpIn, [1, seq, CH]),
          generation_steps: new ort.Tensor('int64', BigInt64Array.from([BigInt(g - 1)]), [1]),
          past_keys: cpK, past_values: cpV,
        }));
        const cl = out.logits.data as Float32Array;
        const c = sample(cl.slice(cl.length - CP.vocab_size), temperature, topK, rand);
        codes.push(c);
        cpK = out.present_keys; cpV = out.present_values;
        cpIn = await timed('proj', () => new Float32Array(this.toCp(new Float32Array(this.cpVec(g - 1, c)), `${g - 1}:${c}`)));
      }
      frames.push(codes);

      // próxima entrada do talker: soma das 16 embeddings + próximo token de texto (ou tts_pad)
      const next = new Float32Array(this.codecVec(g0));
      for (let g = 1; g < 16; g++) { const v = this.cpVec(g - 1, codes[g]); for (let i = 0; i < H; i++) next[i] += v[i]; }
      const tv = step < trailing.length ? trailing[step] : ttsPad;
      for (let i = 0; i < H; i++) next[i] += tv[i];
      const len = L + step + 1;
      const p = BigInt(L + step);
      const dec = await timed('decode', () => this.decode.run({
        inputs_embeds: new ort.Tensor('float32', next, [1, 1, H]),
        attention_mask: new ort.Tensor('int64', new BigInt64Array(len).fill(1n), [1, len]),
        position_ids: new ort.Tensor('int64', BigInt64Array.from([p, p, p]), [3, 1, 1]),
        past_keys: pastK, past_values: pastV,
      }));
      logits = dec.logits.data as Float32Array;
      hidden = dec.hidden_states.data as Float32Array;
      pastK = dec.present_keys; pastV = dec.present_values;
    }
    if (!frames.length) return new Float32Array(0);

    const N = frames.length;
    const flat = new BigInt64Array(16 * N);
    for (let t = 0; t < N; t++) for (let g = 0; g < 16; g++) flat[g * N + t] = BigInt(frames[t][g]);
    const audio = await timed('vocoder', () => this.vocode(new ort.Tensor('int64', flat, [1, 16, N])));
    if (PROF) { console.log(`  perfil (${N} quadros): ` + [...PROF].map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}s`).join(' · ')); PROF.clear(); }
    if (audio.length !== N * SAMPLES_PER_FRAME) console.warn(`aviso: vocoder devolveu ${audio.length} amostras (esperado ${N * SAMPLES_PER_FRAME})`);
    return audio;
  }
}

// teste rápido: node scripts/qwen3-tts.ts "Olá, tudo bem?" vivian saida.wav ["instrução de estilo (1.7B)"]
if (process.argv[1] === import.meta.filename) {
  const [text = 'Olá! Eu sou a Lia.', speaker = 'vivian', out = 'qwen-teste.wav', instruct] = process.argv.slice(2);
  const t0 = performance.now();
  const tts = await Qwen3TTS.load();
  console.log(`modelo carregado em ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  const t1 = performance.now();
  const a = await tts.generate(text, { speaker, instruct, seed: 7 });
  const secs = (performance.now() - t1) / 1000;
  const buf = Buffer.alloc(44 + a.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + a.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(QWEN_RATE, 24);
  buf.writeUInt32LE(QWEN_RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(a.length * 2, 40);
  a.forEach((s, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  (await import('node:fs')).writeFileSync(out, buf);
  console.log(`${out}: ${(a.length / QWEN_RATE).toFixed(2)} s de áudio em ${secs.toFixed(1)} s`);
}
