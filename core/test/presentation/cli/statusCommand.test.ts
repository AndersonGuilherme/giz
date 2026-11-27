import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentVoice } from '../../../src/application/use-cases/voiceHash.ts';
import { projectRepository } from '../../../src/presentation/cli/composition.ts';
import { voiceOf } from '../../../src/presentation/cli/composition/voices.ts';

type Json = Record<string, unknown>;
const CORE = fileURLToPath(new URL('../../../', import.meta.url));
const FIXTURE = join(CORE, 'test/fixtures/minimal-project');
const KEY_VARIABLES = /^(ANTHROPIC|OPENAI|GEMINI|ELEVENLABS|FISH)_API_KEY$|^FAL_KEY$|^GIZ_/;
const tempFolders: string[] = [];
after(() => Promise.all(tempFolders.map((folder) => rm(folder, { recursive: true, force: true }))));

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8')) as Json;

// The minimal project with the ElevenLabs voice and line 1 on a generated scenario (no voice, image or video yet).
async function projectFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-status-cli-'));
  tempFolders.push(folder);
  for (const name of ['project.json', 'script.json', 'cast']) await cp(join(FIXTURE, name), join(folder, name), { recursive: true });
  const script = await readJson(join(folder, 'script.json'));
  const [first, second] = script.lines as Json[];
  const scene = { type: 'scenario', background: { generate: { prompt: 'uma praça' } }, characters: [{ character: 'ana', position: 'center' }] };
  await writeFile(join(folder, 'script.json'), JSON.stringify({ ...script, lines: [{ ...first, scene }, second] }));
  await writeFile(join(folder, 'project.json'), JSON.stringify({ ...(await readJson(join(folder, 'project.json'))), voice: { provider: 'elevenlabs' } }));
  return folder;
}

// Line 1 gets the voice it would get now (its current hash); line 2 one made from another text.
async function saveVoices(folder: string): Promise<void> {
  const project = await projectRepository().load(folder);
  const [first, second] = project.script().lines().each();
  const { hash } = await currentVoice(project, first!, voiceOf(folder, project));
  await mkdir(join(folder, 'voice'), { recursive: true });
  for (const [id, saved] of [['1', hash], ['2', `velho-${second!.id()}`]] as const) {
    await writeFile(join(folder, 'voice', `${id}.wav`), '');
    await writeFile(join(folder, 'voice', `${id}.json`), JSON.stringify({ file: `voice/${id}.wav`, hash: saved }));
  }
}

function giz(args: string[]) {
  const home = mkdtempSync(join(tmpdir(), 'giz-status-home-'));
  tempFolders.push(home);
  mkdirSync(join(home, '.config', 'giz'), { recursive: true });
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !KEY_VARIABLES.test(name)));
  return spawnSync(process.execPath, ['src/presentation/cli/giz.ts', ...args], { cwd: CORE, encoding: 'utf8', env: { ...env, HOME: home } });
}

test('giz status: each stage with its symbol and label, the stale and missing line ids and the cost of what is pending', async () => {
  const folder = await projectFolder();
  await saveVoices(folder);
  await mkdir(join(folder, 'output'));
  await writeFile(join(folder, 'output', 'video.mp4'), '');
  const later = new Date(Date.now() + 60_000);
  await utimes(join(folder, 'output', 'video.mp4'), later, later);
  const run = giz(['status', folder]);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), [
    `etapas de ${folder}:`,
    '· ideia: vazio',
    '✓ roteiro: feito',
    '✓ elenco: feito',
    '○ cenários: a fazer — a gerar: cenas das falas 1',
    '! vozes: desatualizado — desatualizadas: falas 2',
    '! vídeo: desatualizado',
    'custo do que falta:',
    '  cenários (openai, modelo gpt-image-2.6-sunburst): 1 imagem(ns), até US$ 0,0775',
    // "Hoje vamos aprender juntos.": 27 characters at US$ 80 per million.
    '  vozes (elevenlabs, modelo eleven_multilingual_v2): 1 fala(s), até US$ 0,0022',
    '  total: até US$ 0,0796',
  ].join('\n'));
});

test('giz status: script errors are listed under the script; without idea.json the script generation cost is unknown', async () => {
  const folder = await projectFolder();
  await rm(join(folder, 'script.json'));
  const run = giz(['status', folder]);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^· roteiro: vazio$/m);
  assert.match(run.stdout, /^· vozes: vazio$/m);
  assert.match(run.stdout, /^ {2}roteiro \(anthropic, modelo [^)]+\): até desconhecido \(.*idea\.json.*\)$/m);
  assert.match(run.stdout, /^ {2}cenários: desconhecido \(o projeto não carrega\)$/m);
  assert.match(run.stdout, /^ {2}total: até desconhecido$/m);
  await writeFile(join(folder, 'script.json'), JSON.stringify({ chapters: ['A'], lines: [{ id: '1', chapter: 1, speaker: 'ana', text: 'Oi.', pose: 'dance' }] }));
  const broken = giz(['status', folder]);
  assert.match(broken.stdout, /^! roteiro: com erros\n {4}- script\.json › lines\[0\]\.pose: "dance" inválido/m);
  assert.doesNotMatch(broken.stdout + broken.stderr, /at .*\.ts:\d+/);
});

test('giz status: a wrong option or no folder exits with 2', () => {
  for (const args of [['status'], ['status', 'a', 'b'], ['status', 'a', '--tudo']]) {
    const run = giz(args);
    assert.equal(run.status, 2, args.join(' '));
    assert.match(run.stderr, /uso: giz status <pasta> \[--regenerate-script\]/);
  }
});
