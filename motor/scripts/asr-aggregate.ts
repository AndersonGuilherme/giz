// Junta os relatórios do ouvido automático de todas as aulas e lista as palavras erradas em VÁRIAS aulas
// (problema sistemático de pronúncia, não acaso). Uso: node scripts/asr-aggregate.ts
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { norm, wer } from './asr-check.ts';

const root = resolve(import.meta.dirname, '..', '..', 'cursos', 'solid', 'aulas');
const byWord = new Map<string, { n: number; lessons: Set<string>; heard: string[] }>();
for (const d of readdirSync(root).sort()) {
  const asr = join(root, d, 'audio', 'asr.txt'), tim = join(root, d, 'audio', 'timings.json');
  if (!existsSync(asr) || !existsSync(tim)) continue;
  const t = JSON.parse(readFileSync(tim, 'utf8')) as Record<string, { spoken: string }>;
  for (const line of readFileSync(asr, 'utf8').split('\n')) {
    const m = line.match(/^(\d{3}) \(\d+\/\d+\) ouviu: "(.*)"$/);
    if (!m || !t[m[1]]) continue;
    for (const w of wer(norm(t[m[1]].spoken), norm(m[2])).missed) {
      const e = byWord.get(w) ?? { n: 0, lessons: new Set(), heard: [] };
      e.n++; e.lessons.add(d.slice(0, 2)); if (e.heard.length < 2) e.heard.push(`${d.slice(0, 2)}/${m[1]}: "${m[2].slice(0, 70)}"`);
      byWord.set(w, e);
    }
  }
}
const IGNORE = new Set(['e', 'a', 'o', 'de', 'que', 'pra', 'um', 'uma', 'do', 'da', 'no', 'na', 'se', 'em', 'os', 'as', 'por', 'pro']);
const rows = [...byWord].filter(([w, e]) => e.lessons.size >= 2 && !IGNORE.has(w) && !/^\d+$/.test(w)).sort((a, b) => b[1].lessons.size - a[1].lessons.size || b[1].n - a[1].n);
for (const [w, e] of rows.slice(0, 30)) console.log(`${w.padEnd(16)} ${String(e.n).padStart(3)}× em ${e.lessons.size} aulas  ${e.heard[0] ?? ''}`);
