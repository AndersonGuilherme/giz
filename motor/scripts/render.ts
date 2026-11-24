// Pipeline completo de UMA aula: voz (só falas novas/alteradas) → build → MP4.
// Uso: npm run render -- ../courses/<curso>/lessons/<NN-slug>
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { build } from './lesson.ts';
import { loadConfig } from './config.ts';

const conc = loadConfig().render.concurrency;
const renderFlags = conc ? [`--concurrency=${conc}`] : [];

const dir = process.argv[2];
if (!dir) { console.error('uso: npm run render -- <pasta-da-aula>'); process.exit(2); }
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit', cwd: resolve(import.meta.dirname, '..') });

run(process.execPath, ['scripts/tts.ts', dir]);
const { lesson, missingAudio } = await build(dir);
if (missingAudio.length) throw new Error(`falas sem áudio: ${missingAudio.join(', ')}`);
const out = join(resolve(dir), 'render', `aula-${lesson.number}.mp4`);
run('npx', ['remotion', 'render', 'src/index.ts', 'Lesson', out, `--props=${JSON.stringify({ lesson: `${lesson.course}-${lesson.number}` })}`, ...renderFlags]);
console.log(`vídeo: ${out}`);
