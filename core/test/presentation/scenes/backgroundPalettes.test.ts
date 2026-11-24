import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BackgroundPalette } from '../../../src/domain/scenario/BackgroundPalette.ts';
import { VECTOR_BACKGROUNDS } from '../../../src/domain/scenario/BackgroundSource.ts';

const DRAWINGS = fileURLToPath(new URL('../../../src/presentation/scenes/scenario/backgrounds/', import.meta.url));
// Parts drawn for one background only, in a file of their own.
const EXTRA_FILES: Readonly<Record<string, readonly string[]>> = { village: ['villageParts'] };

// Every `colors.<name>` the drawing of a background reads (`layer.colors.fog` included).
async function readNames(background: string): Promise<string[]> {
  const files = [background, ...(EXTRA_FILES[background] ?? [])];
  const sources = await Promise.all(files.map((file) => readFile(`${DRAWINGS}${file}.tsx`, 'utf8')));
  return [...new Set(sources.flatMap((source) => [...source.matchAll(/colors\.(\w+)/g)].map((match) => match[1]!)))].sort();
}

test('every background drawing reads exactly the colors of its domain palette: no unused name, no unknown one', async () => {
  for (const background of VECTOR_BACKGROUNDS) {
    assert.deepEqual(await readNames(background), BackgroundPalette.keys(background).sort(), background);
  }
});
