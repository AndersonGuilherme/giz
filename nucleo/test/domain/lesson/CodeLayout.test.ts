import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CodeLayout } from '../../../src/domain/lesson/CodeLayout.ts';
import type { CodeScene } from '../../../src/domain/script/LessonScenes.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const SCENE: CodeScene = {
  type: 'code',
  title: 'checkout.ts',
  lines: ['export class Checkout {', '  constructor(private email: SmtpEmail) {}', '}'],
  added: [1],
  highlight: ['SmtpEmail'],
};

test('each code line becomes one row with its tokens, indentation kept', () => {
  const layout = CodeLayout.for(SCENE, AspectRatio.HORIZONTAL);
  assert.equal(layout.rows.length, 3);
  assert.equal(layout.rows[1].tokens.map((token) => token.text).join(''), SCENE.lines[1]);
  assert.equal(layout.rows[1].tokens[0].text, '  ');
  assert.deepEqual(layout.rows.map((row) => row.number), [1, 2, 3]);
});

test('added lines are marked and highlighted lines are those that contain a highlight', () => {
  const layout = CodeLayout.for(SCENE, AspectRatio.VERTICAL);
  assert.deepEqual(layout.rows.map((row) => row.added), [false, true, false]);
  assert.deepEqual(layout.rows.map((row) => row.highlighted), [false, true, false]);
  assert.equal(layout.hasHighlight, true);
});

test('rows stack inside the body and the letters shrink for a long line', () => {
  const layout = CodeLayout.for(SCENE, AspectRatio.VERTICAL);
  const last = layout.rows.at(-1)!;
  assert.ok(last.rectangle.y + last.rectangle.height <= layout.body.y + layout.body.height);
  const long = CodeLayout.for({ ...SCENE, lines: ['x'.repeat(70)] }, AspectRatio.VERTICAL);
  assert.ok(long.size < layout.size);
  assert.ok(long.size * 0.6 * 70 <= long.textWidth);
});

test('the language of the tokens comes from the title', () => {
  const python = CodeLayout.for({ type: 'code', title: 'frete.py', lines: ['def frete(): pass'] }, AspectRatio.HORIZONTAL);
  assert.equal(python.rows[0].tokens[0].kind, 'keyword');
});
