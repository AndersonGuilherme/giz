import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUNDLED_FONTS, MONO_FONT, TEXT_FONT } from '../../../src/presentation/scenes/fonts.ts';
import { fontFacesOf } from '../../../src/presentation/remotion/bundledFonts.ts';

const PUBLIC = fileURLToPath(new URL('../../../public', import.meta.url));
const SOURCE = fileURLToPath(new URL('../../../src', import.meta.url));

const sourceFiles = (folder: string): string[] =>
  readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });

test('the text and code fonts are bundled in the public folder (the render copies it), each with its OFL license', () => {
  assert.deepEqual(BUNDLED_FONTS.map(({ family }) => family), ['Nunito', 'JetBrains Mono']);
  for (const { file } of BUNDLED_FONTS) {
    assert.ok(statSync(join(PUBLIC, file)).size > 100_000, `${file} is a whole font`);
    const license = join(PUBLIC, file.replace(/\.ttf$/, '-OFL.txt'));
    assert.match(readFileSync(license, 'utf8'), /SIL OPEN FONT LICENSE/i);
  }
});

test('the scenes draw with the bundled families', () => {
  assert.match(TEXT_FONT, /^"Nunito", /);
  assert.match(MONO_FONT, /^"JetBrains Mono", /);
});

test('the font faces load each file through the media source (the render: staticFile; the Studio: its served URLs)', () => {
  const faces = fontFacesOf((path) => `giz-media://file/core/public/${path}`);
  assert.deepEqual(faces.map(({ family, url }) => [family, url]), [
    ['Nunito', 'giz-media://file/core/public/fonts/Nunito.ttf'],
    ['JetBrains Mono', 'giz-media://file/core/public/fonts/JetBrainsMono.ttf'],
  ]);
  for (const { weight } of faces) assert.match(weight, /^\d+ \d+$/);
});

test('no source file loads a font from the network (no @remotion/google-fonts, no fonts.gstatic.com)', () => {
  const offenders = sourceFiles(SOURCE).filter((path) => /google-fonts|fonts\.gstatic|fonts\.googleapis/.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, []);
  assert.equal(existsSync(join(PUBLIC, 'fonts')), true);
});

test('the render waits for the fonts: one hold per load, released once when they load, or when the view goes first', async () => {
  const { holdWhileLoading } = await import('../../../src/presentation/remotion/bundledFonts.ts');
  const events: string[] = [];
  let handles = 0;
  const hold = { delay: () => `h${(handles += 1)}`, release: (handle: string) => void events.push(`release ${handle}`) };
  let finish: () => void = () => undefined;
  const loading = new Promise<void>((resolve) => (finish = resolve));
  const stop = holdWhileLoading(() => loading, hold);
  assert.deepEqual(events, []);
  finish();
  await loading;
  await new Promise((resolve) => setImmediate(resolve));
  stop();
  assert.deepEqual(events, ['release h1']);
  // StrictMode mounts, unmounts and mounts again: the first hold is released by its cleanup, never left behind.
  const pending = new Promise<void>(() => undefined);
  const first = holdWhileLoading(() => pending, hold);
  first();
  const second = holdWhileLoading(() => Promise.reject(new Error('404')), hold);
  await new Promise((resolve) => setImmediate(resolve));
  second();
  assert.deepEqual(events, ['release h1', 'release h2', 'release h3']);
});
