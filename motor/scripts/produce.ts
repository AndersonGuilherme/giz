// Produção em lote, para QUALQUER curso: para cada aula → voz → build → controle de qualidade (Whisper + tom)
// → render → cópia leve (celular). Grava uma linha por aula em cursos/<curso>/producao-stats.tsv.
// Uso: npm run produce -- <pasta-aula> [<pasta-aula>...]      ex.: npm run produce -- ../cursos/meu-curso/aulas/*
//      O controle de qualidade (Whisper) roda se estiver ligado no `npm run setup`; SKIP_QA=1 pula.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { build } from './lesson.ts';
import { loadConfig } from './config.ts';

const conc = loadConfig().render.concurrency;
const renderFlags = conc ? [`--concurrency=${conc}`] : [];

const motor = resolve(import.meta.dirname, '..');
// o Remotion já traz ffmpeg/ffprobe no pacote do compositor da sua plataforma
const compositors = readdirSync(join(motor, 'node_modules', '@remotion')).filter((d) => d.startsWith('compositor-'));
const compositor = compositors.find((d) => d.endsWith('-gnu')) ?? compositors[0]; // glibc antes de musl
const B = compositor ? join(motor, 'node_modules', '@remotion', compositor) : '';
const bin = (name: string) => (B && existsSync(join(B, name)) ? join(B, name) : name);
const binEnv = { ...process.env, LD_LIBRARY_PATH: B, DYLD_LIBRARY_PATH: B };
const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { cwd: motor, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 << 20 });
const clock = () => new Date().toTimeString().slice(0, 8);

const dirs = process.argv.slice(2).map((d) => resolve(d)).filter((d) => existsSync(join(d, 'roteiro.ts')));
if (!dirs.length) { console.error('uso: npm run produce -- <pasta-aula> [<pasta-aula>...]'); process.exit(2); }
for (const dir of dirs) {
  const start = clock();
  let t = performance.now();
  run(process.execPath, ['scripts/tts.ts', dir]);
  const voice = Math.round((performance.now() - t) / 1000);
  const { lesson, missingAudio } = await build(dir);
  if (missingAudio.length) throw new Error(`aula ${lesson.number}: falas sem áudio ${missingAudio.join(' ')}`);
  const n = lesson.number;
  const stats = resolve(dir, '..', '..', 'producao-stats.tsv');
  if (!existsSync(stats)) writeFileSync(stats, 'aula\tinicio\tfim\tvoz_s\tqa_s\trender_s\tduracao\tWER\tperguntas\ttom_medio_perguntas_st\n');
  t = performance.now();
  let asr = '', avgRise = '-';
  if (loadConfig().qa && !process.env.SKIP_QA) {
    asr = run(process.execPath, ['scripts/asr-check.ts', dir]).split('\n').find((l) => l.startsWith('WER')) ?? '';
    const rises = [...run(process.execPath, ['scripts/pitch-check.ts', dir]).matchAll(/^\d{3} ([+-]\d+\.\d) st/gm)].map((m) => Number(m[1]));
    if (rises.length) avgRise = (rises.reduce((a, b) => a + b, 0) / rises.length).toFixed(1);
  }
  const qa = Math.round((performance.now() - t) / 1000);
  t = performance.now();
  const mp4 = join(dir, 'render', `aula-${n}.mp4`);
  run('npx', ['remotion', 'render', 'src/index.ts', 'Lesson', mp4, `--props=${JSON.stringify({ lesson: `${lesson.course}-${n}` })}`, '--log=error', ...renderFlags]);
  const render = Math.round((performance.now() - t) / 1000);
  execFileSync(bin('ffmpeg'), ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', join(dir, 'render', `aula-${n}-leve.mp4`)], { env: binEnv });
  const dur = Number(execFileSync(bin('ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], { env: binEnv }).toString());
  const durTxt = `${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, '0')}`;
  const wer = asr.match(/WER ([\d.]+%)/)?.[1] ?? '-';
  const q = asr.match(/perguntas percebidas (\d+\/\d+)/)?.[1] ?? '-';
  appendFileSync(stats, `${n}\t${start}\t${clock()}\t${voice}\t${qa}\t${render}\t${durTxt}\t${wer}\t${q}\t${avgRise}\n`);
  console.log(`${lesson.course} aula ${n}: ${durTxt} · voz ${voice}s · QA ${qa}s · render ${render}s ${asr ? `· ${asr}` : ''}`);
}
