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

test('a StudioError keeps its code and message; any other error says it failed, with its own text in the details, never the stack', async () => {
  const busy = guarded<'video.cancel'>(REQUEST_SCHEMAS['video.cancel'], async () => {
    throw new StudioError('busy', 'ocupado');
  });
  assert.deepEqual(await busy({}), { ok: false, failure: { code: 'busy', message: 'ocupado', details: [] } });
  const broken = guarded<'video.cancel'>(REQUEST_SCHEMAS['video.cancel'], async () => {
    throw new Error('disco cheio');
  });
  const result = await broken(undefined);
  assert.deepEqual(result, { ok: false, failure: { code: 'failed', message: 'A operação falhou.', details: ['disco cheio'] } });
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

test('zod messages come in pt-BR', () => {
  const result = REQUEST_SCHEMAS['keys.has'].safeParse({ provider: 'acme' });
  assert.match(result.error?.issues[0]?.message ?? '', /^Opção inválida: esperava uma das seguintes opções/);
});

function serverWith(trusted: boolean) {
  const registered = new Map<string, (event: unknown, payload: unknown) => Promise<unknown>>();
  const server = { handle: (channel: string, listener: (event: unknown, payload: unknown) => Promise<unknown>) => void registered.set(channel, listener) };
  let called = 0;
  const answer = async () => {
    called += 1;
    return null;
  };
  const handlers = Object.fromEntries(Object.keys(REQUEST_SCHEMAS).map((name) => [name, answer])) as unknown as Handlers;
  registerChannels(server, { schemas: REQUEST_SCHEMAS, handlers, trusts: () => trusted });
  return { registered, calls: () => called };
}

test('every channel of the map is registered on the IPC server, and the server answers through the guard', async () => {
  const { registered } = serverWith(true);
  assert.deepEqual([...registered.keys()].sort(), Object.keys(REQUEST_SCHEMAS).sort());
  assert.deepEqual(await registered.get('projects.pick')?.({}, {}), { ok: true, value: null });
  const refused = (await registered.get('projects.pick')?.({}, { folder: '/x' })) as { ok: boolean };
  assert.equal(refused.ok, false);
});

test('a call from an untrusted sender is refused before validation and never reaches the handler', async () => {
  const { registered, calls } = serverWith(false);
  const refused = (await registered.get('projects.pick')?.({}, {})) as { ok: boolean; failure: { code: string } };
  assert.equal(refused.ok, false);
  assert.equal(refused.failure.code, 'invalid-request');
  assert.equal(calls(), 0);
});
