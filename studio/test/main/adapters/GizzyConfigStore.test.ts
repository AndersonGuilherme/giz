import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GizzyConfigStore } from '../../../src/main/adapters/GizzyConfigStore.ts';

// Back to how it was: a variable that was not set is deleted (not set to the string "undefined").
function restoreQuiet(previous: string | undefined): void {
  if (previous === undefined) return void delete process.env.GIZZY_QUIET;
  process.env.GIZZY_QUIET = previous;
}

test("the shared values go through core's config: only the Studio's keys change, every other key stays", async () => {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-shared-'));
  const previousQuiet = process.env.GIZZY_QUIET;
  process.env.GIZZY_QUIET = '1';
  try {
    const file = join(folder, 'gizzycera.config.json');
    await writeFile(file, JSON.stringify({ brand: 'canal', model: '0.6b', device: 'cpu', modelsDir: '/m', styles: { lia: 'calma' } }));
    const store = new GizzyConfigStore(file);
    assert.deepEqual(await store.read(), { modelsDir: '/m', device: 'cpu', model: '0.6b', remotionLicense: 'nao-informado' });
    const written = await store.write({ model: '1.7b', device: 'cuda' });
    assert.equal(written.model, '1.7b');
    const saved = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(saved.brand, 'canal');
    assert.equal(saved.styles.lia, 'calma');
    assert.equal(saved.model, '1.7b');
    assert.equal(saved.device, 'cuda');
    assert.match((await store.defaults()).modelsDir, /\.cache[/\\]giz(zycera)?$/);
  } finally {
    restoreQuiet(previousQuiet);
    await rm(folder, { recursive: true, force: true });
  }
});

test('without gizzycera.config.json the reads are core defaults, and the first write creates it', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-shared-'));
  const previousQuiet = process.env.GIZZY_QUIET;
  process.env.GIZZY_QUIET = '1';
  try {
    const store = new GizzyConfigStore(join(folder, 'gizzycera.config.json'));
    assert.equal((await store.read()).device, 'cpu');
    await store.write({ remotionLicense: 'pessoa-fisica' });
    const saved = JSON.parse(await readFile(join(folder, 'gizzycera.config.json'), 'utf8'));
    assert.equal(saved.remotionLicense, 'pessoa-fisica');
    assert.equal(saved.brand, 'gizzycera');
  } finally {
    restoreQuiet(previousQuiet);
    await rm(folder, { recursive: true, force: true });
  }
});
