import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonAppConfig } from '../../../src/main/adapters/JsonAppConfig.ts';

const CONFIG = { language: 'en', projectsFolder: '/p', providers: { text: 'gemini', image: 'fal', voice: 'fish' }, firstRunDone: true } as const;

test('no file is the first run; a written config reads back; the write leaves no draft behind', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-app-'));
  try {
    const store = new JsonAppConfig(join(folder, 'userData', 'studio.json'));
    assert.equal(await store.read(), null);
    await store.write(CONFIG);
    assert.deepEqual(await store.read(), CONFIG);
    assert.deepEqual(await readdir(join(folder, 'userData')), ['studio.json']);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('a broken or foreign file reads as none (the wizard runs again), never as half a config', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-app-'));
  try {
    const file = join(folder, 'studio.json');
    const store = new JsonAppConfig(file);
    await writeFile(file, '{ nope');
    assert.equal(await store.read(), null);
    await writeFile(file, JSON.stringify({ ...CONFIG, language: 'fr' }));
    assert.equal(await store.read(), null);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
