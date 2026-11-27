import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guarded, registerChannels, type Handlers } from '../../../src/main/ipc/registry.ts';
import { REQUEST_SCHEMAS } from '../../../src/main/ipc/schemas.ts';
import { StudioError } from '../../../src/main/services/StudioError.ts';

test('a payload that fails the channel schema never reaches the handler', async () => {
  let called = false;
  const run = guarded<'video.render'>(REQUEST_SCHEMAS['video.render'], async () => {
    called = true;
    return { video: '', captions: '' };
  });
  const result = await run({ folder: '/p', aspect: '4:3' });
  assert.equal(called, false);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.failure.code, 'invalid-request');
  assert.match(result.failure.details[0] ?? '', /^aspect: /);
});

test('the schemas refuse extra fields, an empty folder, an unknown provider and an empty key', () => {
  assert.equal(REQUEST_SCHEMAS['projects.check'].safeParse({ folder: '/p', extra: 1 }).success, false);
  assert.equal(REQUEST_SCHEMAS['projects.open'].safeParse({ folder: '  ' }).success, false);
  assert.equal(REQUEST_SCHEMAS['keys.has'].safeParse({ provider: 'acme' }).success, false);
  assert.equal(REQUEST_SCHEMAS['keys.set'].safeParse({ provider: 'openai', key: '' }).success, false);
  assert.equal(REQUEST_SCHEMAS['keys.set'].safeParse({ provider: 'openai', key: 'sk-1' }).success, true);
});

test('a valid payload runs the handler and its answer comes back as ok', async () => {
  const run = guarded<'keys.has'>(REQUEST_SCHEMAS['keys.has'], async ({ provider }) => provider === 'openai');
  assert.deepEqual(await run({ provider: 'openai' }), { ok: true, value: true });
});

test('a StudioError keeps its code and message; any other error shows only its message, never the stack', async () => {
  const busy = guarded<'video.cancel'>(REQUEST_SCHEMAS['video.cancel'], async () => {
    throw new StudioError('busy', 'ocupado');
  });
  assert.deepEqual(await busy({}), { ok: false, failure: { code: 'busy', message: 'ocupado', details: [] } });
  const broken = guarded<'video.cancel'>(REQUEST_SCHEMAS['video.cancel'], async () => {
    throw new Error('disco cheio');
  });
  const result = await broken(undefined);
  assert.deepEqual(result, { ok: false, failure: { code: 'failed', message: 'disco cheio', details: [] } });
});

test("core's ProjectError becomes invalid-project with one line per problem (file › field: message)", async () => {
  const error = Object.assign(new Error('projeto inválido'), { problems: [{ file: 'cast/lia.json', path: 'parameters.skin', message: 'cor "roxo" inválida' }] });
  const run = guarded<'projects.open'>(REQUEST_SCHEMAS['projects.open'], async () => {
    throw error;
  });
  const result = await run({ folder: '/p' });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.failure.code, 'invalid-project');
  assert.deepEqual(result.failure.details, ['cast/lia.json › parameters.skin: cor "roxo" inválida']);
});

test('every channel of the map is registered on the IPC server, and the server answers through the guard', async () => {
  const registered = new Map<string, (event: unknown, payload: unknown) => Promise<unknown>>();
  const server = { handle: (channel: string, listener: (event: unknown, payload: unknown) => Promise<unknown>) => void registered.set(channel, listener) };
  const answer = async () => null;
  const handlers = Object.fromEntries(Object.keys(REQUEST_SCHEMAS).map((name) => [name, answer])) as unknown as Handlers;
  registerChannels(server, REQUEST_SCHEMAS, handlers);
  assert.deepEqual([...registered.keys()].sort(), Object.keys(REQUEST_SCHEMAS).sort());
  assert.deepEqual(await registered.get('projects.pick')?.({}, {}), { ok: true, value: null });
  const refused = (await registered.get('projects.pick')?.({}, { folder: '/x' })) as { ok: boolean };
  assert.equal(refused.ok, false);
});
