import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSounds } from '../../../src/infrastructure/sound/writeSounds.ts';

const COMMITTED = fileURLToPath(new URL('../../../public/sounds/', import.meta.url));

test('gizzy sounds writes the committed public/sounds/*.wav byte for byte', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-sounds-'));
  const names = await writeSounds(folder);
  assert.deepEqual(names.map((name) => `${name}.wav`).sort(), readdirSync(COMMITTED).sort());
  for (const name of names) assert.ok(readFileSync(join(folder, `${name}.wav`)).equals(readFileSync(join(COMMITTED, `${name}.wav`))), name);
});
