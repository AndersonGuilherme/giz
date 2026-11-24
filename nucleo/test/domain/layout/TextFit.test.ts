import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TextFit } from '../../../src/domain/layout/TextFit.ts';
import { Font } from '../../../src/domain/layout/Font.ts';
import { CAPTION_FONT } from '../../../src/domain/layout/lessonLayouts.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const withoutSpaces = (lines: readonly string[]) => lines.join('').replace(/\s+/g, '');

test('a short text stays at the base size on one line', () => {
  const r = TextFit.measure('Oi, eu sou a Ana.', CAPTION_FONT, 908);
  assert.deepEqual(r, { lines: ['Oi, eu sou a Ana.'], size: CAPTION_FONT.baseSize(), fits: true });
});
test('a 300-character line in the 9:16 caption shrinks and fits', () => {
  const r = TextFit.measure('x '.repeat(150), CAPTION_FONT, 908);
  assert.ok(r.fits);
  assert.ok(r.size < CAPTION_FONT.baseSize());
  assert.ok(r.size >= CAPTION_FONT.baseSize() * 0.6);
  assert.equal(withoutSpaces(r.lines), 'x'.repeat(150));
});
test('a word longer than the line is broken without losing characters', () => {
  const font = Font.of({ family: 'text', size: 100, lineHeight: 1, maximumLines: 1 });
  const r = TextFit.measure('A'.repeat(80), font, 908);
  assert.equal(r.fits, false);
  assert.equal(r.size, 60);
  assert.ok(r.lines.length > 1);
  assert.equal(withoutSpaces(r.lines), 'A'.repeat(80));
});
test('20 lines of code in 9:16 fit or report an error, never pass silently', () => {
  const code = Array.from({ length: 20 }, (_, i) => `  const valor${i} = calcular(entrada, ${i}); // passo ${i}`).join('\n');
  const mono = Font.of({ family: 'mono', size: 34, lineHeight: 1.4, maximumLines: 24 });
  const width = SafeArea.for(AspectRatio.VERTICAL).width;
  const r = TextFit.measure(code, mono, width);
  const perLine = Math.floor(width / (r.size * 0.6));
  const overflows = r.lines.length > mono.maximumLines() || r.lines.some((l) => l.length > perLine);
  assert.equal(r.fits, !overflows);
  assert.ok(r.lines.length >= 20, 'every code line becomes at least one line');
  assert.equal(withoutSpaces(r.lines), code.replace(/\s+/g, ''));
  const tight = Font.of({ family: 'mono', size: 34, lineHeight: 1.4, maximumLines: 12 });
  assert.equal(TextFit.measure(code, tight, width).fits, false, '20 lines in 12 report an error');
});
test('Font rejects a non-positive size', () => {
  assert.throws(() => Font.of({ family: 'text', size: 0, lineHeight: 1, maximumLines: 1 }), /fonte/);
});

test('the display family (heavy caps) is measured wider and shrinks a long word whole instead of breaking it', () => {
  const display = Font.of({ family: 'display', size: 120, lineHeight: 1.05, maximumLines: 3 });
  const fit = TextFit.measure('INACREDITÁVEL', display, 908);
  assert.deepEqual(fit.lines, ['INACREDITÁVEL']);
  assert.ok(fit.fits);
  assert.ok('INACREDITÁVEL'.length * fit.size * 0.7 <= 908);
});

test('the display family still breaks a word that does not fit even at 60%, and reports it', () => {
  const display = Font.of({ family: 'display', size: 120, lineHeight: 1.05, maximumLines: 1 });
  const fit = TextFit.measure('A'.repeat(40), display, 908);
  assert.equal(fit.fits, false);
});

test('the text family keeps its 0.58 em estimate', () => {
  const text = Font.of({ family: 'text', size: 100, lineHeight: 1.2, maximumLines: 1 });
  assert.equal(TextFit.measure('a'.repeat(17), text, 1000).size, 100);
  assert.notEqual(TextFit.measure('a'.repeat(18), text, 1000).size, 100);
});
