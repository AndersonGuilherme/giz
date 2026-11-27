import { test } from 'node:test';
import assert from 'node:assert/strict';
import { piecesOf, spanCount } from '../../src/renderer/editor/textSpans.ts';

test('the text is cut into plain pieces and numbered [spans]', () => {
  assert.deepEqual(piecesOf('Um cliente [usou um cupom]... e [pagou mais caro].'), [
    { text: 'Um cliente ', span: null },
    { text: '[usou um cupom]', span: 0 },
    { text: '... e ', span: null },
    { text: '[pagou mais caro]', span: 1 },
    { text: '.', span: null },
  ]);
  assert.deepEqual(piecesOf('sem colchetes'), [{ text: 'sem colchetes', span: null }]);
  assert.equal(spanCount('a [b] c [d]'), 2);
  assert.equal(spanCount('a [b c'), 0);
});
