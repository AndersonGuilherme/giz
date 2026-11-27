import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newCommand, scriptCommand } from '../../../src/presentation/cli/commands/scriptCommands.ts';

const CORE = fileURLToPath(new URL('../../../', import.meta.url));
const IDEA_FILE = join(CORE, 'test/fixtures/ai/story-idea.json');
const ANSWER = readFileSync(join(CORE, 'test/fixtures/ai/story-answer.json'), 'utf8');
const KEY_VARIABLES = /^(ANTHROPIC|OPENAI|GEMINI|ELEVENLABS|FISH)_API_KEY$/;

// A clean environment: a temporary HOME and none of the real key variables, so nothing reaches a real service.
function giz(args: string[]) {
  const home = mkdtempSync(join(tmpdir(), 'giz-script-home-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !KEY_VARIABLES.test(name)));
  return spawnSync(process.execPath, ['src/presentation/cli/giz.ts', ...args], { cwd: CORE, encoding: 'utf8', env: { ...env, HOME: home } });
}

// The Anthropic API answering every call with the fixed answer (no network).
function fakeAnthropic() {
  const calls: string[] = [];
  const fetch = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ content: [{ type: 'text', text: ANSWER }], usage: { input_tokens: 9000, output_tokens: 1500 } }));
  }) as typeof globalThis.fetch;
  return { calls, overrides: { fetch, keys: { get: () => 'sk-teste', hint: () => 'defina' } } };
}

async function printed(run: () => Promise<void>): Promise<string> {
  const lines: string[] = [];
  const log = console.log;
  console.log = (message: string) => void lines.push(message);
  try {
    await run();
  } finally {
    console.log = log;
  }
  return lines.join('\n');
}

test('giz new: the estimate first, then the project written from the idea; giz script writes it again keeping the voice', async () => {
  const folder = join(mkdtempSync(join(tmpdir(), 'giz-new-')), 'gatos');
  const { calls, overrides } = fakeAnthropic();
  const output = await printed(() => newCommand(['--idea', IDEA_FILE, folder, '--provider', 'anthropic'], overrides));
  assert.match(output, /^custo estimado \(anthropic, modelo claude-sonnet-5-5\): até US\$ 0,\d+ na primeira chamada, até US\$ 0,\d+ com 3 correções/);
  assert.match(output, /roteiro: 3 fala\(s\), 3 personagem\(ns\), 0 rodada\(s\) de correção → .*gatos/);
  assert.match(output, /uso: 1 chamada\(s\), 9000 tokens de entrada, 1500 de saída/);
  assert.match(output, /próximo passo: giz check .*gatos/);
  assert.deepEqual(calls, ['https://api.anthropic.com/v1/messages']);
  assert.deepEqual(JSON.parse(readFileSync(join(folder, 'idea.json'), 'utf8')), JSON.parse(readFileSync(IDEA_FILE, 'utf8')));

  const project = JSON.parse(readFileSync(join(folder, 'project.json'), 'utf8'));
  writeFileSync(join(folder, 'project.json'), JSON.stringify({ ...project, voice: { provider: 'qwen', model: '0.6b' } }));
  await printed(() => scriptCommand([folder, '--provider', 'anthropic'], overrides));
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(readFileSync(join(folder, 'project.json'), 'utf8')).voice, { provider: 'qwen', model: '0.6b' });

  const check = giz(['check', folder]);
  assert.match(check.stdout, /0 erro\(s\)/);
});

test('--estimate prints the cost and calls nothing', async () => {
  const folder = join(mkdtempSync(join(tmpdir(), 'giz-new-')), 'gatos');
  const { calls, overrides } = fakeAnthropic();
  const output = await printed(() => newCommand(['--idea', IDEA_FILE, folder, '--estimate'], overrides));
  assert.match(output, /custo estimado \(anthropic/);
  assert.deepEqual(calls, []);
});

test('wrong usage exits with 2; a missing or invalid idea, or an existing project, exits with 1 and a readable message', () => {
  for (const args of [['new', 'pasta'], ['new', '--idea', IDEA_FILE], ['new', '--idea', IDEA_FILE, 'a', 'b'], ['script'], ['new', '--idea', IDEA_FILE, 'x', '--oops']]) {
    const run = giz(args);
    assert.equal(run.status, 2, args.join(' '));
    assert.match(run.stderr, /^uso: giz (new --idea <ideia\.json> <pasta>|script <pasta>) \[--provider anthropic\|openai\|gemini\] \[--estimate\]/);
  }
  const parent = mkdtempSync(join(tmpdir(), 'giz-new-cli-'));
  const missing = giz(['new', '--idea', join(parent, 'nada.json'), join(parent, 'p')]);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /nada\.json: arquivo não encontrado/);

  const wrong = join(parent, 'errada.json');
  writeFileSync(wrong, JSON.stringify({ format: 'podcast', aspect: '9:16', targetSeconds: 5 }));
  const invalid = giz(['new', '--idea', wrong, join(parent, 'p')]);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /errada\.json: ideia inválida:\n- format: "podcast" inválido \(use story, lesson\)\n- targetSeconds: use um número inteiro/);
  assert.doesNotMatch(invalid.stderr, /at .*\.ts:\d+/);

  const existing = join(parent, 'existente');
  mkdirSync(existing);
  writeFileSync(join(existing, 'project.json'), '{}');
  const taken = giz(['new', '--idea', IDEA_FILE, existing]);
  assert.equal(taken.status, 1);
  assert.match(taken.stderr, /já existe um projeto em .*existente \(para refazer o roteiro: giz script/);

  const noIdea = giz(['script', existing]);
  assert.equal(noIdea.status, 1);
  assert.match(noIdea.stderr, /existente\/idea\.json: arquivo não encontrado/);
});

test('without any text key: the estimate, then the key error with where to put it (no call is made)', () => {
  const parent = mkdtempSync(join(tmpdir(), 'giz-new-cli-'));
  const run = giz(['new', '--idea', IDEA_FILE, join(parent, 'p')]);
  assert.equal(run.status, 1);
  assert.match(run.stdout, /custo estimado \(anthropic/);
  assert.match(run.stderr, /chave da anthropic não encontrada: defina ANTHROPIC_API_KEY/);
  const unknown = giz(['new', '--idea', IDEA_FILE, join(parent, 'p'), '--provider', 'mistral']);
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /provedor "mistral" inválido \(use anthropic, openai, gemini\)/);
});
