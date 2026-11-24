import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NUCLEO = fileURLToPath(new URL('../../../', import.meta.url));

// A resolve hook that refuses any module under motor/: the run fails if a command touches the motor (its
// node_modules, onnxruntime included, are needed only by the Qwen voice).
const NO_MOTOR = `
export async function resolve(specifier, context, next) {
  const resolved = await next(specifier, context);
  if (/\\/motor\\//.test(resolved.url)) throw new Error('motor carregado: ' + resolved.url);
  return resolved;
}`;
const HOOK = `import { register } from 'node:module'; register('data:text/javascript,' + encodeURIComponent(${JSON.stringify(NO_MOTOR)}));`;

function gizWithoutMotor(args: string[]) {
  return spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(HOOK)}`, 'src/presentation/cli/giz.ts', ...args], {
    cwd: NUCLEO, encoding: 'utf8',
  });
}

test('check runs without loading anything from motor/ (the Qwen voice is imported only to generate a voice)', () => {
  const run = gizWithoutMotor(['check', 'test/fixtures/minimal-project']);
  assert.doesNotMatch(run.stderr, /motor carregado/);
  assert.match(run.stdout, /0 erro\(s\)/);
  assert.equal(run.status, 0);
});

// The fixture voices were recorded before project.json named the model (the hash of a line without a model leaves it
// out), so the copy drops `voice.model`: then both lines are up to date and the voice never loads.
test('voice runs without motor/: with every line up to date, no voice model is even loaded', () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-voice-'));
  cpSync(join(NUCLEO, 'test/fixtures/minimal-project'), folder, { recursive: true });
  const project = JSON.parse(readFileSync(join(folder, 'project.json'), 'utf8'));
  writeFileSync(join(folder, 'project.json'), JSON.stringify({ ...project, voice: { provider: 'qwen' } }));
  const run = gizWithoutMotor(['voice', folder]);
  assert.doesNotMatch(run.stderr, /motor carregado/);
  assert.match(run.stdout, /0 gerada\(s\), 2 já em dia/);
  assert.equal(run.status, 0);
});

test('setup --help, and the tool subcommands answer a wrong call with their usage (exit 2)', () => {
  const help = gizWithoutMotor(['setup', '--help']);
  assert.match(help.stdout, /uso: giz setup \[--defaults\] \[--dry-run\]/);
  assert.equal(help.status, 0);
  const qa = gizWithoutMotor(['qa']);
  assert.match(qa.stderr, /giz qa asr <pasta-do-projeto>/);
  assert.equal(qa.status, 2);
  const gpu = gizWithoutMotor(['gpu', 'nada']);
  assert.match(gpu.stderr, /uso: giz gpu info \| install/);
  assert.equal(gpu.status, 2);
  const usage = gizWithoutMotor(['nada']);
  assert.match(usage.stderr, /setup \| models \| gpu \| qa \| sounds/);
});

test('the hook does catch a motor import (the test above would otherwise prove nothing)', () => {
  const run = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(HOOK)}`, '-e', "await import('../motor/scripts/qwen3-tts.ts')", '--input-type=module'], {
    cwd: NUCLEO, encoding: 'utf8',
  });
  assert.match(run.stderr, /motor carregado/);
});
