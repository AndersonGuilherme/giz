// Valida uma aula ANTES de gastar tempo com voz e vídeo:
//   1. os exemplos de código passam nos testes  2. o roteiro tipa  3. a linha do tempo monta (duração estimada)
// Uso: npm run check -- <pasta-da-aula>
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build } from './lesson.ts';

const dir = process.argv[2];
if (!dir) { console.error('uso: npm run check -- <pasta-da-aula>'); process.exit(2); }
const lessonDir = resolve(dir);
const motor = resolve(import.meta.dirname, '..');
const ex = join(lessonDir, 'exemplos');
const step = (what: string, f: () => void) => {
  try { f(); } catch { console.error(`\n✖ falhou: ${what} (veja a mensagem acima)`); process.exit(1); }
};
const tests = existsSync(ex) ? readdirSync(ex).filter((f) => f.endsWith('.test.ts')) : [];
if (tests.length) {
  console.log(`1/3 testes dos exemplos (${tests.join(', ')})`);
  step('testes dos exemplos', () => execFileSync(process.execPath, ['--test', '--test-reporter=spec', ...tests], { cwd: ex, stdio: 'inherit' }));
} else console.log('1/3 sem testes em exemplos/ (recomendado ter: o código da tela precisa rodar)');
console.log('2/3 tipos do roteiro (tsc)');
step('tipos do roteiro', () => execFileSync(process.execPath, [join(motor, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '-p', motor], { stdio: 'inherit' }));
console.log('3/3 linha do tempo');
const { props, missingAudio } = await build(lessonDir);
console.log(`ok: ${props.cues.length} falas, ${(props.totalFrames / props.fps / 60).toFixed(1)} min${missingAudio.length ? ' (estimado: ainda sem voz)' : ''}`);
