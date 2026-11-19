// Produção em lote: para cada aula → voz → build → controle de qualidade (Whisper + tom) → render → cópia leve.
// Grava uma linha por aula em aulas/producao-stats.tsv com os tempos de máquina e as métricas de qualidade.
// Uso: node scripts/produce.ts <pasta-aula> [<pasta-aula>...]
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

const motor = resolve(import.meta.dirname, '..');
const stats = resolve(motor, '..', 'producao-stats.tsv');
if (!existsSync(stats)) writeFileSync(stats, 'aula\tinicio\tfim\tvoz_s\tqa_s\trender_s\tduracao\tWER\tperguntas\ttom_medio_perguntas_st\n');
const B = join(motor, 'node_modules/@remotion/compositor-linux-x64-gnu');
const run = (cmd: string, args: string[], env: Record<string, string> = {}) =>
  execFileSync(cmd, args, { cwd: motor, env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const clock = () => new Date().toTimeString().slice(0, 8);

for (const arg of process.argv.slice(2)) {
  const dir = resolve(arg);
  const n = basename(dir).slice(0, 2);
  const start = clock();
  let t = Date.now();
  run('node', ['scripts/tts.ts', dir]);
  const voice = Math.round((Date.now() - t) / 1000);
  const built = run('node', ['scripts/lesson.ts', 'build', dir]);
  if (/sem áudio atualizado/.test(built)) throw new Error(`aula ${n}: falas sem áudio\n${built}`);
  t = Date.now();
  const asr = run('node', ['scripts/asr-check.ts', dir]).split('\n').find((l) => l.startsWith('WER')) ?? '';
  const pitch = run('node', ['scripts/pitch-check.ts', dir]);
  const qa = Math.round((Date.now() - t) / 1000);
  const rises = [...pitch.matchAll(/^\d{3} ([+-]\d+\.\d) st/gm)].map((m) => Number(m[1]));
  const avgRise = rises.length ? (rises.reduce((a, b) => a + b, 0) / rises.length).toFixed(1) : '-';
  t = Date.now();
  const mp4 = join(dir, 'render', `aula-${n}.mp4`);
  run('npx', ['remotion', 'render', 'src/index.ts', 'Lesson', mp4, `--props={"lesson":"solid-${n}"}`, '--concurrency=6', '--log=error']);
  const render = Math.round((Date.now() - t) / 1000);
  execFileSync(join(B, 'ffmpeg'), ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', join(dir, 'render', `aula-${n}-leve.mp4`)], { env: { LD_LIBRARY_PATH: B } });
  const dur = Number(execFileSync(join(B, 'ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], { env: { LD_LIBRARY_PATH: B } }).toString());
  const durTxt = `${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, '0')}`;
  const wer = asr.match(/WER ([\d.]+%)/)?.[1] ?? '-';
  const q = asr.match(/perguntas percebidas (\d+\/\d+)/)?.[1] ?? '-';
  appendFileSync(stats, `${n}\t${start}\t${clock()}\t${voice}\t${qa}\t${render}\t${durTxt}\t${wer}\t${q}\t${avgRise}\n`);
  console.log(`aula ${n}: ${durTxt} · voz ${voice}s · QA ${qa}s · render ${render}s · ${asr} · tom ${avgRise} st`);
  void readFileSync;
}
