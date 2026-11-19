// Mede a entonação: quantos semitons o FIM de cada pergunta está acima (+) ou abaixo (−) da média da frase.
// Pergunta de sim/não em pt-BR precisa terminar SUBINDO. Uso: node scripts/pitch-check.ts <aula> [sufixo]
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function readWav(path: string) {
  const b = readFileSync(path); const rate = b.readUInt32LE(24); const n = (b.length - 44) / 2;
  const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = b.readInt16LE(44 + i * 2) / 32768;
  return { x, rate };
}
// F0 por autocorrelação normalizada em janelas de 40 ms (75–400 Hz); null se não houver voz
export function f0Track(x: Float32Array, rate: number) {
  const win = Math.round(0.04 * rate), hop = Math.round(0.01 * rate);
  const minLag = Math.floor(rate / 400), maxLag = Math.floor(rate / 75);
  const out: Array<number | null> = [];
  for (let s = 0; s + win + maxLag < x.length; s += hop) {
    let energy = 0; for (let i = 0; i < win; i++) energy += x[s + i] ** 2;
    if (energy / win < 1e-4) { out.push(null); continue; }
    let best = 0, bestLag = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < win; i++) { c += x[s + i] * x[s + i + lag]; e1 += x[s + i] ** 2; e2 += x[s + i + lag] ** 2; }
      const r = c / Math.sqrt(e1 * e2 + 1e-12);
      if (r > best) { best = r; bestLag = lag; }
    }
    out.push(best > 0.6 ? rate / bestLag : null);
  }
  return out;
}
const median = (a: number[]) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
export function endRise(x: Float32Array, rate: number) {
  const f = f0Track(x, rate);
  const voiced = f.map((v, i) => [i, v] as const).filter(([, v]) => v !== null) as Array<[number, number]>;
  if (voiced.length < 10) return null;
  const lastIdx = voiced[voiced.length - 1][0];
  const tail = voiced.filter(([i]) => i >= lastIdx - 25).map(([, v]) => v); // ~250 ms finais com voz
  return 12 * Math.log2(median(tail) / median(voiced.map(([, v]) => v)));
}
if (process.argv[1] === import.meta.filename) {
  const [dir, suffix = ''] = process.argv.slice(2);
  const L = resolve(dir);
  const t = JSON.parse(readFileSync(join(L, 'audio', `timings${suffix}.json`), 'utf8')) as Record<string, { file: string; spoken: string }>;
  const rows: string[] = [];
  for (const [id, v] of Object.entries(t).sort()) {
    if (!v.spoken.trim().endsWith('?')) continue;
    const { x, rate } = readWav(join(L, 'audio', v.file));
    const r = endRise(x, rate);
    rows.push(`${id} ${r === null ? '  n/a' : (r >= 0 ? '+' : '') + r.toFixed(1)} st  "${v.spoken.slice(-42)}"`);
  }
  console.log(rows.join('\n'));
}
