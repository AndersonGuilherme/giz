import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GenerationFailure, type TextProviderName } from '../../../src/main/ports/ScriptCore.ts';
import { IdeaService } from '../../../src/main/services/IdeaService.ts';
import type { ScriptProgress } from '../../../src/shared/projects.ts';
import { FakeScriptCore, IDEA } from '../../doubles/scriptFakes.ts';

function setup(options: Readonly<{ key?: string; needsKey?: boolean }> = { key: 'sk-1' }) {
  const core = new FakeScriptCore();
  const progress: ScriptProgress[] = [];
  const keysAsked: TextProviderName[] = [];
  const keyOf = async (provider: TextProviderName) => (keysAsked.push(provider), options.key);
  const service = new IdeaService({
    core, provider: async () => 'gemini', keyOf, needsKey: options.needsKey ?? true,
    newFolder: async (theme) => `/projetos/${theme.length}`, portraitsFolder: '/user/portraits', progress: (step) => progress.push(step),
  });
  return { core, service, progress, keysAsked };
}

test('the estimate uses the text provider chosen in Settings', async () => {
  const { core, service } = setup();
  assert.deepEqual(await service.estimate(IDEA), { provider: 'gemini', model: 'modelo', firstCall: 0.1, maximum: 1.07, calls: 4 });
  assert.deepEqual(core.estimates, ['gemini']);
});

test('a generation reads the key in main, streams each call and answers the new folder', async () => {
  const { core, service, progress, keysAsked } = setup();
  let job: unknown;
  core.generator = async (_idea, given) => {
    job = given;
    given.onCall(1, 4);
    given.onCall(2, 4);
    return { repairs: 1, calls: 2 };
  };
  assert.deepEqual(await service.generate(IDEA), { folder: '/projetos/23', repairs: 1, calls: 2 });
  assert.deepEqual(progress, [{ call: 1, most: 4 }, { call: 2, most: 4 }]);
  assert.deepEqual(keysAsked, ['gemini']);
  assert.deepEqual({ ...(job as object), signal: undefined, onCall: undefined }, { folder: '/projetos/23', provider: 'gemini', key: 'sk-1', signal: undefined, onCall: undefined });
});

test('without a key nothing is called (outside rehearsal mode)', async () => {
  const { core, service } = setup({});
  let called = false;
  core.generator = async () => ((called = true), { repairs: 0, calls: 1 });
  await assert.rejects(service.generate(IDEA), { code: 'invalid-request', message: /gemini/ });
  assert.equal(called, false);
  const rehearsal = setup({ needsKey: false });
  assert.equal((await rehearsal.service.generate(IDEA)).calls, 1);
});

test('one generation at a time; cancel answers "cancelled" at once, even while a call is still running', async () => {
  const { core, service } = setup();
  let seen: AbortSignal | undefined;
  core.generator = (_idea, job) => {
    seen = job.signal;
    return new Promise(() => undefined);
  };
  const running = service.generate(IDEA);
  await new Promise((done) => setImmediate(done));
  await assert.rejects(service.generate(IDEA), { code: 'busy' });
  assert.equal(service.cancel(), true);
  await assert.rejects(running, { code: 'cancelled' });
  assert.equal(seen?.aborted, true, 'core sees the abort: it saves nothing after it');
  assert.equal(service.cancel(), false);
});

test('a script that never became valid is a readable failure with its problems and the draft folder', async () => {
  const { core, service } = setup();
  core.generator = async () => {
    throw new GenerationFailure(['script.json › lines[1].pose: "dance" inválido'], '/projetos/23.draft');
  };
  await assert.rejects(service.generate(IDEA), (error: { code: string; details: string[]; path: string; message: string }) => {
    assert.equal(error.code, 'failed');
    assert.match(error.message, /3 rodadas de correção/);
    assert.deepEqual(error.details, ['script.json › lines[1].pose: "dance" inválido']);
    assert.equal(error.path, '/projetos/23.draft');
    return true;
  });
});

test('the portraits are drawn once per run; when they cannot be drawn the answer is null', async () => {
  const { core, service } = setup();
  const first = await service.portraits();
  await service.portraits();
  assert.equal(core.portraitCalls, 1);
  assert.equal(first?.ids[0], 'bia');
  const failing = setup();
  failing.core.portraitsFail = true;
  assert.equal(await failing.service.portraits(), null);
});
