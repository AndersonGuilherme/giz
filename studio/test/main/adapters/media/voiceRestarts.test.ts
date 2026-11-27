import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restartingAfterConfig, restartingAfterSetup } from '../../../../src/main/adapters/media/voiceRestarts.ts';
import type { SharedConfigStore, SharedSettings } from '../../../../src/main/ports/SettingsStores.ts';
import type { SetupTools } from '../../../../src/main/ports/SetupTools.ts';

const SHARED: SharedSettings = { modelsDir: '/m', device: 'cpu', model: '0.6b', remotionLicense: 'pessoa-fisica' } as SharedSettings;

test('a finished setup task (a model, Whisper, the GPU) closes the voice worker; a failed or stopped one does not', async () => {
  let restarts = 0;
  let fail = false;
  const tools: SetupTools = {
    gpu: async () => ({}) as never,
    models: async () => ({}) as never,
    run: async () => {
      if (fail) throw new Error('parado');
    },
  };
  const watched = restartingAfterSetup(tools, () => restarts++);
  const job = { modelsDir: '/m', signal: new AbortController().signal, onProgress: () => undefined };
  await watched.run('voice-1.7b', job);
  assert.equal(restarts, 1);
  fail = true;
  await assert.rejects(watched.run('whisper', job), /parado/);
  assert.equal(restarts, 1);
  await watched.gpu('/m');
  assert.equal(restarts, 1);
});

test('a giz.config.json change the voices read (model, device, models folder) closes the voice worker; the license does not', async () => {
  let restarts = 0;
  const store: SharedConfigStore = { read: async () => SHARED, write: async (patch) => ({ ...SHARED, ...patch }), defaults: async () => SHARED };
  const watched = restartingAfterConfig(store, () => restarts++);
  assert.equal((await watched.write({ model: '1.7b' })).model, '1.7b');
  await watched.write({ device: 'cuda' } as Partial<SharedSettings>);
  await watched.write({ modelsDir: '/outra' });
  assert.equal(restarts, 3);
  await watched.write({ remotionLicense: 'empresa-ate-3' });
  assert.equal(restarts, 3);
});
