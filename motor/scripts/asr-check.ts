// "Ouvido" automático: transcreve cada fala com Whisper (local, CPU) e mede quantas palavras ele erra.
// Pronúncia mais natural = menos erros. Lista as palavras problemáticas para o dicionário de pronúncia.
// Uso: node scripts/asr-check.ts <pasta-da-aula> [sufixo-dos-wav]   (ex.: -B para comparar variantes)
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pipeline } from '@huggingface/transformers';
import { pathToFileURL } from 'node:url';

const NUMBER_WORDS = new Set('zero um uma dois duas tres quatro cinco seis sete oito nove dez onze doze treze quatorze catorze quinze dezesseis dezessete dezoito dezenove vinte trinta quarenta cinquenta sessenta setenta oitenta noventa cem cento duzentos duzentas trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos mil milhao milhoes'.split(' '));
// números por extenso e em dígitos viram o mesmo token '#'; 'reais', 'R$', '%' e 'por cento' são ignorados
export const norm = (s: string) => s.toLowerCase().replace(/(\w)-(\w)/g, '$1$2').replace(/r\$/g, ' ').replace(/%/g, ' ')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  .map((w) => (/^\d+$/.test(w) || NUMBER_WORDS.has(w) ? '#' : w))
  .filter((w, i, arr) => !(w === 'e' && arr[i - 1] === '#' && arr[i + 1] === '#') && w !== 'reais' && w !== 'real' && !(w === 'por' && arr[i + 1] === '#'))
  .filter((w, i, arr) => !(w === '#' && arr[i - 1] === '#'));

// distância de edição por palavra (WER) e as palavras de referência que não bateram
export function wer(ref: string[], hyp: string[]) {
  const d = Array.from({ length: ref.length + 1 }, (_, i) => [i, ...Array(hyp.length).fill(0)]);
  for (let j = 1; j <= hyp.length; j++) d[0][j] = j;
  for (let i = 1; i <= ref.length; i++) for (let j = 1; j <= hyp.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  const missed: string[] = [];
  let i = ref.length, j = hyp.length;
  while (i > 0 && j > 0) {
    if (ref[i - 1] === hyp[j - 1]) { i--; j--; } else if (d[i][j] === d[i - 1][j - 1] + 1) { missed.push(ref[i - 1]); i--; j--; }
    else if (d[i][j] === d[i - 1][j] + 1) { missed.push(ref[i - 1]); i--; } else j--;
  }
  while (i > 0) missed.push(ref[--i]);
  return { errors: d[ref.length][hyp.length], missed };
}

function readWav16k(path: string): Float32Array {
  const b = readFileSync(path);
  const rate = b.readUInt32LE(24);
  const n = (b.length - 44) / 2;
  const src = new Float32Array(n);
  for (let k = 0; k < n; k++) src[k] = b.readInt16LE(44 + k * 2) / 32768;
  const out = new Float32Array(Math.floor((n * 16000) / rate));
  for (let k = 0; k < out.length; k++) { const x = (k * rate) / 16000, i0 = Math.floor(x), f = x - i0; out[k] = src[i0] * (1 - f) + (src[i0 + 1] ?? 0) * f; }
  return out;
}

export async function makeAsr() {
  return pipeline('automatic-speech-recognition', 'onnx-community/whisper-small', { dtype: 'q8', device: 'cpu' });
}

async function main() {
  const [dir, suffix = ''] = process.argv.slice(2);
  const L = resolve(dir);
  const timings = JSON.parse(readFileSync(join(L, 'audio', `timings${suffix}.json`), 'utf8')) as Record<string, { file: string; spoken: string }>;
  // referência = a legenda (texto real), não a grafia fonética do `say`
  const { lesson } = (await import(pathToFileURL(join(L, 'roteiro.ts')).href)) as { lesson: { cues: Array<{ id: string; text: string }> } };
  const caption = new Map(lesson.cues.map((c) => [c.id, c.text.replace(/\[([^\]]+)\]/g, '$1')]));
  const asr = await makeAsr();
  let errs = 0, words = 0, qTotal = 0, qHeard = 0;
  const bad = new Map<string, number>();
  const report: string[] = [];
  for (const [id, t] of Object.entries(timings).sort()) {
    if (!existsSync(join(L, 'audio', t.file))) continue;
    const out = (await asr(readWav16k(join(L, 'audio', t.file)), { language: 'portuguese', task: 'transcribe' })) as { text: string };
    const ref = norm(caption.get(id) ?? t.spoken), hyp = norm(out.text);
    const { errors, missed } = wer(ref, hyp);
    errs += errors; words += ref.length;
    if (t.spoken.trim().endsWith('?')) { qTotal++; if (out.text.trim().endsWith('?')) qHeard++; else report.push(`${id} PERGUNTA NÃO PERCEBIDA: "${out.text.trim()}"`); }
    for (const m of missed) bad.set(m, (bad.get(m) ?? 0) + 1);
    if (errors) report.push(`${id} (${errors}/${ref.length}) ouviu: "${out.text.trim()}"`);
  }
  const summary = `WER ${((100 * errs) / words).toFixed(1)}% (${errs}/${words} palavras) · perguntas percebidas ${qHeard}/${qTotal}`;
  console.log(summary);
  console.log('palavras mais erradas:', [...bad].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w, n]) => `${w}×${n}`).join(' '));
  writeFileSync(join(L, 'audio', `asr${suffix}.txt`), [summary, ...report].join('\n') + '\n');
}

if (process.argv[1] === import.meta.filename) await main();
