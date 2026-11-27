import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GizScriptCore } from '../../../src/main/adapters/GizScriptCore.ts';
import { REHEARSAL_FAILURE } from '../../../src/main/adapters/rehearsal/RehearsalTextProvider.ts';
import { GenerationFailure } from '../../../src/main/ports/ScriptCore.ts';
import type { IdeaFields } from '../../../src/shared/projects.ts';

// The real core (its use cases, schemas and check) with rehearsal mode's pretend text AI: no network, no key.
const core = new GizScriptCore({ rehearsal: true });
const IDEA: IdeaFields = { format: 'story', aspect: '9:16', targetSeconds: 30, theme: 'E se os gatos falassem?', audience: 'jovens', tone: 'leve', language: 'pt-BR', cast: ['bia', 'caio'] };

async function withFolder(use: (folder: string) => Promise<void>): Promise<void> {
  const parent = await mkdtemp(join(tmpdir(), 'giz-script-core-'));
  try {
    await use(join(parent, 'projeto'));
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
}

const job = (folder: string, calls: Array<[number, number]>, signal = new AbortController().signal) =>
  ({ folder, provider: 'anthropic' as const, signal, onCall: (call: number, most: number) => calls.push([call, most]) });

test('a hand-written project starts valid; a change in its script shows up as a line error', async () => {
  await withFolder(async (folder) => {
    await core.start(IDEA, folder);
    assert.deepEqual(await core.validate(folder), { errors: [], warnings: [] });
    const stages = await core.stages(folder);
    assert.deepEqual(stages.map(({ stage, state }) => `${stage}:${state}`).slice(0, 3), ['idea:done', 'script:done', 'cast:done']);
    const script = JSON.parse(await readFile(join(folder, 'script.json'), 'utf8'));
    script.lines[0].text = 'Um [trecho] sem beat.';
    await writeFile(join(folder, 'script.json'), JSON.stringify(script));
    const { errors } = await core.validate(folder);
    assert.equal(errors.length, 1);
    assert.equal(errors[0]!.lineId, '01');
  });
});

test('a schema problem comes with its file and path', async () => {
  await withFolder(async (folder) => {
    await core.start(IDEA, folder);
    const script = JSON.parse(await readFile(join(folder, 'script.json'), 'utf8'));
    script.lines[0].pose = 'dance';
    await writeFile(join(folder, 'script.json'), JSON.stringify(script));
    const { errors } = await core.validate(folder);
    assert.deepEqual(errors.map(({ file, path }) => `${file} ${path}`), ['script.json lines[0].pose']);
  });
});

test('the rehearsal AI is repaired on its second call and the project is saved', async () => {
  await withFolder(async (folder) => {
    const calls: Array<[number, number]> = [];
    assert.deepEqual(await core.generate(IDEA, job(folder, calls)), { repairs: 1, calls: 2 });
    assert.deepEqual(calls, [[1, 4], [2, 4]]);
    assert.deepEqual((await core.validate(folder)).errors, []);
  });
});

test('a generation that never becomes valid is a GenerationFailure with its draft next to the folder', async () => {
  await withFolder(async (folder) => {
    const failing = { ...IDEA, theme: `Gatos ${REHEARSAL_FAILURE}` };
    await assert.rejects(core.generate(failing, job(folder, [])), (error: unknown) => {
      assert.ok(error instanceof GenerationFailure);
      assert.match(error.problems.join('\n'), /"dance" inválido/);
      assert.equal(error.draft, `${folder}.draft`);
      return true;
    });
    await assert.rejects(access(folder));
  });
});

test('presets, estimate, vocabulary and the scene check come from core', async () => {
  const presets = await core.presets();
  assert.ok(presets.cast.some(({ id, rig }) => id === 'bia' && rig === 'giz'));
  assert.ok(presets.scenes.some(({ id }) => id === 'castle-rain'));
  assert.ok(presets.backgrounds.includes('street'));
  const estimate = await core.estimate(IDEA, 'openai');
  assert.equal(estimate.provider, 'openai');
  assert.equal(estimate.calls, 4);
  assert.ok((estimate.maximum ?? 0) > (estimate.firstCall ?? 0));
  assert.ok((await core.vocabulary()).poses.includes('shrug'));
  assert.deepEqual(await core.checkScene({ type: 'talk' }), []);
  assert.equal((await core.checkScene({ type: 'quote', text: '' }))[0]?.path, 'text');
});
