import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

test('the hook does catch a motor import (the test above would otherwise prove nothing)', () => {
  const run = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(HOOK)}`, '-e', "await import('../motor/scripts/qwen3-tts.ts')", '--input-type=module'], {
    cwd: NUCLEO, encoding: 'utf8',
  });
  assert.match(run.stderr, /motor carregado/);
});
