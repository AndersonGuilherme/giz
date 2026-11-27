import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CORE = fileURLToPath(new URL('../../../', import.meta.url));
const KEY_VARIABLES = /^(ANTHROPIC|OPENAI|GEMINI|ELEVENLABS|FISH)_API_KEY$/;

// A clean environment: a temporary HOME and none of the real key variables.
function giz(args: string[], extra: Record<string, string> = {}) {
  const home = mkdtempSync(join(tmpdir(), 'giz-keys-home-'));
  mkdirSync(join(home, '.config', 'giz'), { recursive: true });
  writeFileSync(join(home, '.config', 'giz', 'fish.key'), 'fish-do-arquivo-555\n');
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !KEY_VARIABLES.test(name)));
  return spawnSync(process.execPath, ['src/presentation/cli/giz.ts', ...args], { cwd: CORE, encoding: 'utf8', env: { ...env, HOME: home, ...extra } });
}

test('keys list shows which services have a key and where to put the missing ones, never the values', () => {
  const run = giz(['keys', 'list'], { ANTHROPIC_API_KEY: 'sk-ant-secreta-111' });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /anthropic: chave configurada/);
  assert.match(run.stdout, /fish: chave configurada/);
  assert.match(run.stdout, /openai: sem chave \(defina OPENAI_API_KEY ou crie .*openai\.key\)/);
  assert.match(run.stdout, /gemini: sem chave/);
  assert.match(run.stdout, /elevenlabs: sem chave/);
  assert.doesNotMatch(run.stdout + run.stderr, /secreta-111|do-arquivo-555/);
});

test('keys test without a key fails readably (exit 1) before any call', () => {
  const run = giz(['keys', 'test', 'gemini']);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /chave da gemini não encontrada: defina GEMINI_API_KEY/);
  assert.doesNotMatch(run.stderr, /at .*\.ts:\d+/);
});

test('keys with a wrong action or provider prints the usage and exits with 2', () => {
  for (const args of [['keys'], ['keys', 'test'], ['keys', 'test', 'fish'], ['keys', 'apagar']]) {
    const run = giz(args);
    assert.equal(run.status, 2, args.join(' '));
    assert.match(run.stderr, /uso: giz keys list \| test <anthropic\|openai\|gemini>/);
  }
});
