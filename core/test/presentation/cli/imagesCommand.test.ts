import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { KeyStore } from '../../../src/application/ports/KeyStore.ts';
import { imageSize } from '../../../src/infrastructure/disk/imageSize.ts';
import { pngOfSize } from '../../doubles/FakeImageProvider.ts';

type Json = Record<string, unknown>;
const CORE = fileURLToPath(new URL('../../../', import.meta.url));
const FIXTURE = join(CORE, 'test/fixtures/minimal-project');
const KEY_VARIABLES = /^(ANTHROPIC|OPENAI|GEMINI|ELEVENLABS|FISH)_API_KEY$|^FAL_KEY$/;
const tempFolders: string[] = [];
after(() => Promise.all(tempFolders.map((folder) => rm(folder, { recursive: true, force: true }))));

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8')) as Json;

// The minimal project (production rig: the CLI uses the real catalog) with both lines on generated scenarios.
async function projectFolder(project: Json = {}): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-images-cli-'));
  tempFolders.push(folder);
  await cp(FIXTURE, folder, { recursive: true });
  const script = await readJson(join(folder, 'script.json'));
  const lines = (script.lines as Json[]).map((line, index) => ({
    ...line, scene: { type: 'scenario', background: { generate: { prompt: `cena ${index + 1}` } }, characters: [{ character: 'ana', position: 'center' }] },
  }));
  await writeFile(join(folder, 'script.json'), JSON.stringify({ ...script, lines }));
  await writeFile(join(folder, 'project.json'), JSON.stringify({ ...(await readJson(join(folder, 'project.json'))), ...project }));
  return folder;
}

function gizzy(args: string[]) {
  const home = mkdtempSync(join(tmpdir(), 'gizzy-images-home-'));
  mkdirSync(join(home, '.config', 'gizzycera'), { recursive: true });
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !KEY_VARIABLES.test(name)));
  return spawnSync(process.execPath, ['src/presentation/cli/gizzy.ts', ...args], { cwd: CORE, encoding: 'utf8', env: { ...env, HOME: home } });
}

test('gizzy images --estimate prints only the cost (the project provider, its default model) and calls nothing', async () => {
  const folder = await projectFolder({ imageProvider: 'gemini' });
  const run = gizzy(['images', folder, '--estimate']);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), 'custo estimado (gemini, modelo gemini-nano-banana-2.1): 2 imagem(ns) a gerar, até US$ 0,1008; 0 já em dia');
});

test('gizzy images: a wrong option, both --only and --force, or a wrong provider exit with 2', async () => {
  const folder = await projectFolder();
  for (const args of [['images'], ['images', folder, '--tamanho', '3'], ['images', folder, '--only', '1', '--force', '2']]) {
    const run = gizzy(args);
    assert.equal(run.status, 2, args.join(' '));
    assert.match(run.stderr, /uso: gizzy images <pasta> \[--provider openai\|gemini\|fal\] \[--estimate\] \[--only <fala>\] \[--force <fala>\]/);
  }
  const wrong = gizzy(['images', folder, '--provider', 'dalle', '--estimate']);
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /provedor "dalle" inválido \(use openai, gemini, fal\)/);
});

test('gizzy images without a key fails readably (exit 1) after the estimate, before any call', async () => {
  const folder = await projectFolder();
  const run = gizzy(['images', folder, '--provider', 'fal']);
  assert.equal(run.status, 1);
  assert.match(run.stdout, /custo estimado \(fal, modelo fal-ai\/flux-2-pro\): 2 imagem\(ns\) a gerar/);
  assert.match(run.stderr, /chave da fal não encontrada: defina FAL_KEY/);
  assert.doesNotMatch(run.stderr, /at .*\.ts:\d+/);
});

test('gizzy images --only: one call (injected fetch), the PNG saved, the script pointed to it; a second run calls nothing', async () => {
  const { imagesCommand } = await import('../../../src/presentation/cli/commands/imagesCommand.ts');
  const folder = await projectFolder({ imageProvider: 'fal' });
  const calls: string[] = [];
  const body = { images: [{ url: `data:image/png;base64,${Buffer.from(pngOfSize(1216, 2160)).toString('base64')}` }] };
  const fetch = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof globalThis.fetch;
  const keys: KeyStore = { get: () => 'fal-secreta-1', hint: () => 'defina FAL_KEY' };
  const logs: string[] = [];
  const log = console.log;
  console.log = (text: string) => void logs.push(text);
  try {
    await imagesCommand([folder, '--only', '2'], { fetch, keys });
    await imagesCommand([folder, '--only', '2'], { fetch, keys });
  } finally {
    console.log = log;
  }
  assert.deepEqual(calls, ['https://fal.run/fal-ai/flux-2-pro']);
  assert.deepEqual(await imageSize(join(folder, 'scenes/2.png')), { width: 1216, height: 2160 });
  const lines = (await readJson(join(folder, 'script.json'))).lines as Json[];
  assert.equal(((lines[1]!.scene as Json).background as Json).image, 'scenes/2.png');
  assert.equal(((lines[0]!.scene as Json).background as Json).image, undefined);
  assert.match(logs[0]!, /custo estimado \(fal, modelo fal-ai\/flux-2-pro\): 1 imagem\(ns\) a gerar, até US\$ 0,165; 0 já em dia/);
  assert.equal(logs[1], 'cena da fala 2 (1/1): imagem gerada');
  assert.match(logs[2]!, /^1 gerada\(s\), 0 já em dia → .*scenes\npróximo passo: gizzy check /);
  assert.match(logs[3]!, /0 imagem\(ns\) a gerar, até US\$ 0,00; 1 já em dia/);
  assert.equal(logs[4], 'cena da fala 2 (1/1): já em dia');
  assert.match(logs[5]!, /^0 gerada\(s\), 1 já em dia/);
  assert.doesNotMatch(logs.join('\n'), /fal-secreta-1/);
});

test('gizzy images: a scene on the person\'s own image is left alone, with the "usa imagem própria" note', async () => {
  const { imagesCommand } = await import('../../../src/presentation/cli/commands/imagesCommand.ts');
  const folder = await projectFolder({ imageProvider: 'fal' });
  const script = await readJson(join(folder, 'script.json'));
  const [first, second] = script.lines as Json[];
  const scene = first!.scene as Json;
  const own = { ...first, scene: { ...scene, background: { ...(scene.background as Json), image: 'images/minha.png' } } };
  await writeFile(join(folder, 'script.json'), JSON.stringify({ ...script, lines: [own, second] }));
  const calls: string[] = [];
  const fetch = (async (url: string | URL | Request) => {
    calls.push(String(url));
    throw new Error('não devia chamar');
  }) as typeof globalThis.fetch;
  const logs: string[] = [];
  const log = console.log;
  console.log = (text: string) => void logs.push(text);
  try {
    await imagesCommand([folder, '--only', '1'], { fetch, keys: { get: () => 'k', hint: () => 'h' } });
  } finally {
    console.log = log;
  }
  assert.deepEqual(calls, []);
  assert.match(logs[0]!, /0 imagem\(ns\) a gerar, até US\$ 0,00; 0 já em dia, 1 usa\(m\) imagem própria/);
  assert.match(logs[1]!, /^cena da fala 1 \(1\/1\): usa imagem própria/);
  assert.match(logs[2]!, /^0 gerada\(s\), 0 já em dia, 1 usa\(m\) imagem própria/);
  const lines = (await readJson(join(folder, 'script.json'))).lines as Json[];
  assert.equal(((lines[0]!.scene as Json).background as Json).image, 'images/minha.png');
});
