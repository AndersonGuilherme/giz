import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GizMediaCore } from '../../../../src/main/adapters/media/GizMediaCore.ts';
import { RehearsalPainter } from '../../../../src/main/adapters/media/rehearsal/RehearsalPainter.ts';
import { RehearsalVoice } from '../../../../src/main/adapters/media/rehearsal/RehearsalVoice.ts';

// The real core (its use cases, stores, stages and checks) with rehearsal mode's painter and voice: no network, no key.
const FIXTURE = fileURLToPath(new URL('../../../../../core/test/fixtures/minimal-project', import.meta.url));
const voice = new RehearsalVoice();
const core = new GizMediaCore({ painter: (real) => new RehearsalPainter(real), voice });

async function withProject(use: (folder: string) => Promise<void>): Promise<void> {
  const parent = await mkdtemp(join(tmpdir(), 'giz-media-core-'));
  const folder = join(parent, 'project');
  await cp(FIXTURE, folder, { recursive: true, filter: (path) => !path.includes('/voice') && !path.includes('/output') });
  const script = JSON.parse(await readFile(join(folder, 'script.json'), 'utf8'));
  script.lines[0].scene.background = { vector: 'room', generate: { prompt: 'uma sala de aula ao entardecer' } };
  await writeFile(join(folder, 'script.json'), JSON.stringify(script));
  try {
    await use(folder);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
}

test('the catalog and the character check come from core\'s real rigs', async () => {
  const catalog = await core.catalog();
  assert.deepEqual(catalog.rigs.map(({ id }) => id), ['giz', 'lia-style']);
  assert.ok(catalog.qwenVoices.includes('vivian'));
  const problems = await core.checkCharacter({ id: 'ana', name: 'Ana', rig: 'giz', parameters: { outfit: 'tuxedo' }, voice: { id: 'vivian' }, defaultExpression: 'happy' });
  assert.equal(problems[0]!.path, 'parameters.outfit');
});

test('a scene image: estimate, then made by the painter, saved and linked; the stage counts it done', async () => {
  await withProject(async (folder) => {
    assert.deepEqual((await core.items(folder)).scenarios.missing, ['1']);
    const job = { lineId: '1', force: false, provider: 'openai' as const };
    const cost = await core.imageCost(folder, job);
    assert.equal(cost.pending, 1);
    assert.ok(cost.dollars! > 0);
    let called = false;
    const queued: string[] = [];
    const queue = async (write: () => Promise<void>) => (queued.push('link'), write());
    await core.generateImage(folder, { ...job, onCall: () => void (called = true), queued: queue });
    assert.ok(called);
    assert.deepEqual(queued, ['link'], "core's link of the image went through the folder's queue");
    assert.equal(JSON.parse(await readFile(join(folder, 'script.json'), 'utf8')).lines[0].scene.background.image, 'scenes/1.png');
    await access(join(folder, 'scenes', '1.png'));
    const shape = await core.imageShape(join(folder, 'scenes', '1.png'), '9:16');
    assert.deepEqual(shape, { width: 1216, height: 2160, matches: true });
    const items = await core.items(folder);
    assert.deepEqual([items.scenarios.missing, items.scenarios.stale], [[], []]);
  });
});

test('the voices: every pending line, then one line again; an own take makes its line from the take', async () => {
  await withProject(async (folder) => {
    const lines: string[] = [];
    await core.generateVoices(folder, { onLine: (_done, _total, lineId) => lines.push(lineId) });
    assert.deepEqual(lines, ['1', '2']);
    assert.deepEqual((await core.items(folder)).voices, { stale: [], missing: [] });
    const before = voice.requests.length;
    const take = await readFile(join(folder, 'voice', '2.wav'));
    await core.checkWav(take);
    await cp(join(folder, 'voice', '2.wav'), join(folder, 'recordings', '1.wav'));
    assert.deepEqual((await core.items(folder)).voices.stale, ['1']);
    await core.generateVoices(folder, { only: '1' });
    assert.equal(voice.requests.length, before);
    assert.deepEqual((await core.items(folder)).voices, { stale: [], missing: [] });
  });
});

test('a sample with the rehearsal voice: a WAV with its mouth; a text file is no WAV', async () => {
  const sample = await core.sample({ provider: 'qwen' }, { id: 'vivian', text: 'Olá, tudo bem?', language: 'pt-BR' });
  assert.equal(Buffer.from(sample.wav.subarray(0, 4)).toString('latin1'), 'RIFF');
  assert.equal(sample.envelope.length, sample.visemes.length);
  await assert.rejects(core.checkWav(new TextEncoder().encode('not a wav')), /não é um arquivo WAV/);
  assert.equal(await core.imageFormat(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), 'png');
});
