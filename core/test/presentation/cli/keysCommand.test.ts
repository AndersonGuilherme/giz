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
function gizzy(args: string[], extra: Record<string, string> = {}) {
  const home = mkdtempSync(join(tmpdir(), 'gizzy-keys-home-'));
  mkdirSync(join(home, '.config', 'gizzycera'), { recursive: true });
  writeFileSync(join(home, '.config', 'gizzycera', 'fish.key'), 'fish-do-arquivo-555\n');
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !KEY_VARIABLES.test(name)));
  return spawnSync(process.execPath, ['src/presentation/cli/gizzy.ts', ...args], { cwd: CORE, encoding: 'utf8', env: { ...env, HOME: home, ...extra } });
}

test('keys list shows which services have a key and where to put the missing ones, never the values', () => {
  const run = gizzy(['keys', 'list'], { ANTHROPIC_API_KEY: 'sk-ant-secreta-111' });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /anthropic: chave configurada/);
  assert.match(run.stdout, /fish: chave configurada/);
  assert.match(run.stdout, /openai: sem chave \(defina OPENAI_API_KEY ou crie .*openai\.key\)/);
  assert.match(run.stdout, /gemini: sem chave/);
  assert.match(run.stdout, /elevenlabs: sem chave/);
  assert.doesNotMatch(run.stdout + run.stderr, /secreta-111|do-arquivo-555/);
});

test('keys test without a key fails readably (exit 1) before any call', () => {
  const run = gizzy(['keys', 'test', 'gemini']);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /chave da gemini não encontrada: defina GEMINI_API_KEY/);
  assert.doesNotMatch(run.stderr, /at .*\.ts:\d+/);
});

test('keys with a wrong action or provider prints the usage and exits with 2', () => {
  for (const args of [['keys'], ['keys', 'test'], ['keys', 'test', 'fish'], ['keys', 'apagar']]) {
    const run = gizzy(args);
    assert.equal(run.status, 2, args.join(' '));
    assert.match(run.stderr, /uso: gizzy keys list \| test <anthropic\|openai\|gemini>/);
  }
});

test('keys test: one call with the key, then "ok" with the model and the tokens (injected fetch, no network)', async () => {
  const { keysCommand } = await import('../../../src/presentation/cli/commands/keysCommand.ts');
  const calls: string[] = [];
  const fetch = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 11, output_tokens: 2 } }));
  }) as typeof globalThis.fetch;
  const keys = { get: () => 'sk-teste', hint: () => 'defina' };
  const printed: string[] = [];
  const log = console.log;
  console.log = (message: string) => void printed.push(message);
  try {
    await keysCommand(['test', 'anthropic'], { fetch, keys });
  } finally {
    console.log = log;
  }
  assert.deepEqual(calls, ['https://api.anthropic.com/v1/messages']);
  assert.match(printed.join('\n'), /^anthropic: ok \(modelo claude-sonnet-5-5, 11 tokens de entrada, 2 de saída\)$/);
});

test('keys test makes a single attempt: a 503 is not retried', async () => {
  const { keysCommand } = await import('../../../src/presentation/cli/commands/keysCommand.ts');
  let count = 0;
  const fetch = (async () => { count++; return new Response('{}', { status: 503 }); }) as typeof globalThis.fetch;
  await assert.rejects(keysCommand(['test', 'gemini'], { fetch, keys: { get: () => 'k', hint: () => '' } }), /Google Gemini: serviço indisponível \(503\)/);
  assert.equal(count, 1);
});

