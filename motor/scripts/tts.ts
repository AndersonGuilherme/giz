// Voz sintética LOCAL e gratuita: Kokoro-82M (pesos Apache-2.0) com vozes pt-BR, fonética do espeak-ng (pt-br).
// Para cada fala: audio/cue-<id>.wav + duração + volume por frame + visema por frame + posição de cada frase
// → audio/timings.json. Falas com texto/voz/velocidade inalterados não são regravadas (hash).
// Uso: node scripts/tts.ts <pasta-da-aula> [ids...]
//      VOICE_OVERRIDE=teo:pm_santa:1.0  (opcional, para comparar vozes)  OUT_SUFFIX=-santa (não sobrescreve)
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { KokoroTTS } from 'kokoro-js';
import type { Lesson, Speaker } from '../src/types.ts';
import { CAST } from '../src/cast.ts';

const FPS = 30;
const RATE = 24000;
const SENTENCE_PAUSE = 0.14; // s entre frases dentro da mesma fala
const DSP_VERSION = 4; // muda quando o pós-processamento de áudio muda (força regravar)

// ENTONAÇÃO DE PERGUNTA. O Kokoro termina toda pergunta com o tom CAINDO (medido: −0,8 a −5,3 semitons nas 9
// perguntas da aula 01), igual a uma afirmação. Em pt-BR, pergunta de sim/não só se distingue pela subida final.
// Aqui o fim da pergunta tem o tom elevado por TD-PSOLA (ciclos da voz reaproximados, SEM mudar a duração):
// até +QRISE_YN semitons (sim/não) ou +QRISE_WH (como/por que/qual...). Conferido com scripts/pitch-check.ts.
const QRISE_YN = Number(process.env.QRISE_YN ?? 10);
const QRISE_WH = Number(process.env.QRISE_WH ?? 3);
const PSOLA_CONF = Number(process.env.PSOLA_CONF ?? 0.4); // final de frase do Kokoro é soprado: critério de "tem voz" mais tolerante
const QRISE_TAIL = Number(process.env.QRISE_TAIL ?? 0.6); // s finais com voz que recebem a subida
const WH = /^(e\s+|mas\s+|então\s+|e\s+aí\s+)?(como|por\s*que|porque|o\s+que|que|qual|quais|quem|onde|quando|quanto|quantos|quantas|pra\s+que|cadê)\b/i;

function periodAt(x: Float32Array, center: number): number | null {
  const win = Math.round(0.03 * RATE), minLag = Math.floor(RATE / 400), maxLag = Math.floor(RATE / 70);
  const s0 = Math.max(0, center - win);
  if (s0 + win + maxLag >= x.length) return null;
  let e = 0; for (let i = 0; i < win; i++) e += x[s0 + i] ** 2;
  if (e / win < 2e-5) return null;
  let best = 0, bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0, e1 = 0, e2 = 0;
    for (let i = 0; i < win; i++) { c += x[s0 + i] * x[s0 + i + lag]; e1 += x[s0 + i] ** 2; e2 += x[s0 + i + lag] ** 2; }
    const r = c / Math.sqrt(e1 * e2 + 1e-12);
    if (r > best) { best = r; bestLag = lag; }
  }
  return best > PSOLA_CONF ? bestLag : null;
}

export function questionRise(audio: Float32Array, sentence: string): Float32Array {
  const t = sentence.trim();
  if (!t.endsWith('?')) return audio;
  const semis = WH.test(t) ? QRISE_WH : QRISE_YN;
  if (semis <= 0) return audio;
  // âncora: o fim da ÚLTIMA SÍLABA COM VOZ (não o sopro final, que não tem tom)
  let end = audio.length - 1;
  while (end > 0 && Math.abs(audio[end]) < 0.02) end--;
  const step = Math.round(0.01 * RATE);
  while (end > step && !periodAt(audio, end)) end -= step;
  if (end <= step) return audio;
  end = Math.min(audio.length - 1, end + Math.round(0.03 * RATE));
  const start = Math.max(0, end - Math.round(QRISE_TAIL * RATE));
  // marcas de análise: uma por ciclo nos trechos com voz (no pico local), passo fixo de 5 ms nos sem voz
  const marks: Array<{ at: number; T: number; voiced: boolean }> = [];
  let pos = start;
  while (pos < audio.length) {
    const T = periodAt(audio, pos);
    if (T) {
      let peak = pos, pv = 0;
      for (let i = Math.max(start, pos - (T >> 2)); i < Math.min(audio.length, pos + (T >> 2)); i++) if (Math.abs(audio[i]) > pv) { pv = Math.abs(audio[i]); peak = i; }
      marks.push({ at: peak, T, voiced: true });
      pos = peak + T;
    } else { marks.push({ at: pos, T: 120, voiced: false }); pos += 120; }
  }
  const out = new Float32Array(audio.length - start), wsum = new Float32Array(audio.length - start);
  let ts = 0, k = 0;
  while (ts < out.length) {
    const abs = start + ts;
    while (k + 1 < marks.length && Math.abs(marks[k + 1].at - abs) <= Math.abs(marks[k].at - abs)) k++;
    const m = marks[k];
    const p = Math.min(1, Math.max(0, (abs - start) / Math.max(1, end - start)));
    const ratio = m.voiced ? Math.pow(2, (semis * Math.pow(p, 1.3)) / 12) : 1;
    const half = m.T;
    for (let i = -half; i < half; i++) {
      const src = m.at + i, dst = ts + i;
      if (src < 0 || src >= audio.length || dst < 0 || dst >= out.length) continue;
      const w = 0.5 - 0.5 * Math.cos((Math.PI * (i + half)) / half);
      out[dst] += audio[src] * w; wsum[dst] += w;
    }
    ts += Math.max(20, Math.round(m.T / ratio));
  }
  for (let i = 0; i < out.length; i++) out[i] = wsum[i] > 0.15 ? out[i] / wsum[i] : 0;
  const res = new Float32Array(audio.length);
  res.set(audio.subarray(0, start));
  const fade = Math.min(240, out.length);
  for (let i = 0; i < out.length; i++) {
    const a = i < fade ? i / fade : 1;
    res[start + i] = out[i] * a + audio[start + i] * (1 - a);
  }
  return res;
}

export type Segment = { c0: number; c1: number; f0: number; f1: number }; // caracteres do texto falado limpo → frames
export type CueTiming = { file: string; durationSec: number; envelope: number[]; visemes: string; segments: Segment[]; spoken: string; hash: string };
export type Timings = Record<string, CueTiming>;

const MARK = /\[([^\]]+)\]/g;
const PAUSE = /<pausa\s+([\d.]+)>/g;
export const spokenText = (raw: string) => raw.replace(PAUSE, '').replace(MARK, '$1').replace(/\s{2,}/g, ' ').trim();

function voiceFor(who: Speaker, cueSpeed = 1) {
  const o = process.env.VOICE_OVERRIDE?.split(',').map((s) => s.split(':')).find(([w]) => w === who);
  const v = o ? { id: o[1], speed: Number(o[2] ?? CAST[who].voice.speed) } : CAST[who].voice;
  return { id: v.id, speed: Math.round(v.speed * cueSpeed * 100) / 100 };
}

function ensureVoices(ids: string[]) {
  const dst = resolve(import.meta.dirname, '..', 'node_modules', 'kokoro-js', 'voices');
  for (const id of ids) {
    const src = resolve(import.meta.dirname, '..', 'assets', 'voices', `${id}.bin`);
    if (!existsSync(join(dst, `${id}.bin`)) && existsSync(src)) copyFileSync(src, join(dst, `${id}.bin`));
  }
}

// Pronúncia: só para a voz. A legenda mantém o texto original.
function loadLexicon(lessonDir: string): Array<[RegExp, string]> {
  const files = [resolve(lessonDir, '..', '..', 'pronuncia.json'), resolve(import.meta.dirname, '..', 'pronuncia.json')];
  const out: Array<[RegExp, string]> = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const [k, v] of Object.entries(JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>)) {
      out.push([new RegExp(`(?<![\\p{L}])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu'), v]);
    }
  }
  return out;
}

// Fonética pt-BR com o espeak-ng completo (o 'phonemizer' do kokoro-js só traz inglês).
type EspeakWorker = { set_voice(v: string): void; synthesize_ipa(t: string): { ipa: string } };
let espeak: EspeakWorker | null = null;
async function phonemizePtBr(text: string): Promise<string> {
  if (!espeak) {
    const require = createRequire(import.meta.url);
    const factory = (await import(require.resolve('@echogarden/espeak-ng-emscripten'))).default;
    espeak = new (await factory()).eSpeakNGWorker() as EspeakWorker;
    espeak.set_voice('pt-br');
  }
  const out: string[] = [];
  for (const m of text.matchAll(/([^,.;:!?…]+)([,.;:!?…]*)/g)) {
    const words = m[1].trim();
    if (!words) continue;
    const ipa = espeak.synthesize_ipa(words).ipa.split('\n').filter(Boolean).map((l) => l.replace(/_/g, '')).join(' ');
    out.push(normalizePhonemes(ipa) + (m[2] ? m[2].replace('…', '...').slice(0, 3) : ''));
  }
  return out.join(' ');
}

// No pt-br, o espeak devolve os mnemônicos 'æ' (a final átono) e 'y' (e final átono): em IPA são ɐ e ɪ.
function normalizePhonemes(p: string): string {
  return p
    .replace(/æ/g, 'ɐ').replace(/y/g, 'ɪ')
    .replace(/t͡ʃ|tʃ/g, 'ʧ').replace(/d͡ʒ|dʒ/g, 'ʤ').replace(/t͡s/g, 'ʦ').replace(/d͡z/g, 'ʣ')
    .replace(/ʲ/g, 'j').replace(/[͜͡]/g, '').replace(/\s+/g, ' ').trim()
    // O espeak insere 'ə' depois do r que fecha sílaba ("certo" → sɛɾətʊ, "porque" → poɾəky): soa estrangeiro.
    .replace(PHON_VARIANT === 'schwa' ? /$^/ : /ɾə(?=[^aeiouɐɛɔɪʊəãõẽĩũ\s,.;:!?ˈˌ])/g, 'ɾ');
}
// Medido em 2026-11-19 com o ouvido automático (Whisper): sem o 'ə' 12,7% de erro × com 12,5% — empate. Mantém o original.
const PHON_VARIANT = process.env.PHON_VARIANT ?? 'schwa';

// Fonema → forma de boca. X = repouso, M = lábios fechados (m/b/p), F = lábio nos dentes (f/v).
const VISEME: Array<[RegExp, string]> = [
  [/[aɐɑ]/, 'A'], [/[eɛə]/, 'E'], [/[iɪj]/, 'I'], [/[oɔ]/, 'O'], [/[uʊw]/, 'U'], [/[mbp]/, 'M'], [/[fv]/, 'F'],
];
function phonemesToVisemes(ipa: string): string[] {
  const out: string[] = [];
  for (const ch of ipa.normalize('NFD')) {
    if (/[̀-ͯˈˌː\s,.;:!?]/.test(ch)) continue;
    out.push(VISEME.find(([re]) => re.test(ch))?.[1] ?? 'C');
  }
  return out;
}

function rmsFrames(samples: Float32Array): number[] {
  const hop = RATE / FPS;
  const out: number[] = [];
  for (let f = 0; f < Math.ceil(samples.length / hop); f++) {
    let s = 0, n = 0;
    for (let i = Math.floor(f * hop); i < Math.min(samples.length, Math.floor((f + 1) * hop)); i++) { s += samples[i] ** 2; n++; }
    out.push(Math.sqrt(s / Math.max(1, n)));
  }
  return out;
}

function envelope(rms: number[]): number[] {
  const sorted = [...rms].sort((a, b) => a - b);
  const ref = sorted[Math.floor(sorted.length * 0.92)] || 1;
  return rms.map((v, i) => {
    const x = Math.min(1, ((rms[i - 1] ?? v) + 2 * v + (rms[i + 1] ?? v)) / 4 / ref);
    return Math.round((x < 0.12 ? 0 : Math.pow(x, 0.8)) * 100) / 100;
  });
}

function toWav(samples: Float32Array): Buffer {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  return buf;
}

function normalizeLoudness(x: Float32Array, targetRms = 0.085): Float32Array {
  let s = 0, n = 0, peak = 0;
  for (const v of x) { if (Math.abs(v) > 0.01) { s += v * v; n++; } peak = Math.max(peak, Math.abs(v)); }
  const gain = Math.min(targetRms / Math.sqrt(s / Math.max(1, n)), 0.95 / Math.max(peak, 1e-6));
  return x.map((v) => v * gain);
}

// Divide o texto falado em frases e pausas explícitas, guardando a posição de cada frase no texto limpo.
type Piece = { kind: 'text'; text: string; c0: number; c1: number } | { kind: 'pause'; seconds: number };
function pieces(raw: string): Piece[] {
  const out: Piece[] = [];
  let clean = '';
  for (const part of raw.replace(MARK, '$1').split(/(<pausa\s+[\d.]+>)/)) {
    const p = part.match(/<pausa\s+([\d.]+)>/);
    if (p) { out.push({ kind: 'pause', seconds: Number(p[1]) }); continue; }
    for (const s of part.match(/[^.!?:…]+[.!?:…]*\s*/g) ?? []) {
      const text = s.replace(/\s{2,}/g, ' ').trim();
      if (!text) continue;
      if (clean.length) clean += ' ';
      const c0 = clean.length;
      clean += text;
      out.push({ kind: 'text', text, c0, c1: clean.length });
    }
  }
  return out;
}

async function main() {
  const [dirArg, ...only] = process.argv.slice(2);
  if (!dirArg) { console.error('uso: node scripts/tts.ts <pasta-da-aula> [ids...]'); process.exit(2); }
  const lessonDir = resolve(dirArg);
  const suffix = process.env.OUT_SUFFIX ?? '';
  const audioDir = join(lessonDir, 'audio');
  mkdirSync(audioDir, { recursive: true });
  const { lesson } = (await import(pathToFileURL(join(lessonDir, 'roteiro.ts')).href)) as { lesson: Lesson };
  const timingsPath = join(audioDir, `timings${suffix}.json`);
  const timings: Timings = existsSync(timingsPath) ? JSON.parse(readFileSync(timingsPath, 'utf8')) : {};
  const lexicon = loadLexicon(lessonDir);
  const valid = new Set(lesson.cues.map((c) => c.id));
  for (const id of Object.keys(timings)) if (!valid.has(id)) delete timings[id];

  ensureVoices([...new Set(lesson.cues.map((c) => voiceFor(c.speaker).id))]);
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });

  for (const cue of lesson.cues) {
    if (only.length && !only.includes(cue.id)) continue;
    const voice = voiceFor(cue.speaker, cue.speed);
    const raw = cue.say ?? cue.text;
    // o hash usa o texto JÁ com o dicionário aplicado: mudar o dicionário só regrava as falas que ele afeta
    let lexed = raw; for (const [re, rep] of lexicon) lexed = lexed.replace(re, rep);
    const hash = createHash('sha1').update(JSON.stringify([voice, lexed, PHON_VARIANT, DSP_VERSION])).digest('hex').slice(0, 12);
    const file = `cue-${cue.id}${suffix}.wav`;
    if (!only.length && timings[cue.id]?.hash === hash && existsSync(join(audioDir, file))) continue;

    const chunks: Float32Array[] = [];
    const segments: Segment[] = [];
    const visemePlan: Array<{ f0: number; f1: number; v: string[] }> = [];
    let samplesSoFar = 0;
    const push = (a: Float32Array) => { chunks.push(a); samplesSoFar += a.length; };
    const ps = pieces(raw);
    for (const [k, p] of ps.entries()) {
      if (p.kind === 'pause') { push(new Float32Array(Math.round(p.seconds * RATE))); continue; }
      let spoken = p.text;
      for (const [re, rep] of lexicon) spoken = spoken.replace(re, rep);
      const phon = await phonemizePtBr(spoken);
      if (process.env.TTS_DEBUG) console.log(`  ${phon}`);
      const { input_ids } = tts.tokenizer(phon, { truncation: true });
      const audio = questionRise((await tts.generate_from_ids(input_ids, { voice: voice.id as never, speed: voice.speed })).audio as Float32Array, p.text);
      const f0 = Math.floor(samplesSoFar / (RATE / FPS));
      push(audio);
      const f1 = Math.ceil(samplesSoFar / (RATE / FPS));
      segments.push({ c0: p.c0, c1: p.c1, f0, f1 });
      visemePlan.push({ f0, f1, v: phonemesToVisemes(phon) });
      if (k < ps.length - 1 && ps[k + 1].kind === 'text') push(new Float32Array(Math.round(SENTENCE_PAUSE * RATE)));
    }
    let samples: Float32Array = new Float32Array(samplesSoFar);
    let o = 0;
    for (const c of chunks) { samples.set(c, o); o += c.length; }
    samples = normalizeLoudness(samples);
    const env = envelope(rmsFrames(samples));

    // visemas: os fonemas de cada frase espalhados pelos frames com voz daquela frase
    const vis = env.map(() => 'X');
    for (const { f0, f1, v } of visemePlan) {
      const voiced: number[] = [];
      for (let f = f0; f < Math.min(f1, env.length); f++) if (env[f] > 0) voiced.push(f);
      voiced.forEach((f, n) => { vis[f] = v[Math.min(v.length - 1, Math.floor((n / voiced.length) * v.length))] ?? 'C'; });
    }

    writeFileSync(join(audioDir, file), toWav(samples));
    timings[cue.id] = { file, durationSec: samples.length / RATE, envelope: env, visemes: vis.join(''), segments, spoken: spokenText(raw), hash };
    writeFileSync(timingsPath, JSON.stringify(timings));
    console.log(`${cue.id} ${voice.id}@${voice.speed} ${(samples.length / RATE).toFixed(1)}s`);
  }
}

if (process.argv[1] === import.meta.filename) await main();
export const phonemizeForLab = (t: string) => phonemizePtBr(t);
