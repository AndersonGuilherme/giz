import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isStrictlyInside, slugOf } from '../../../src/main/services/folderNames.ts';

test('a folder name from a theme: lower case, no accents, words joined by "-", at most 48 characters', () => {
  assert.equal(slugOf('E se os gatos falassem?'), 'e-se-os-gatos-falassem');
  assert.equal(slugOf('Ação & Reação: São João'), 'acao-reacao-sao-joao');
  assert.equal(slugOf('../../etc'), 'etc');
  assert.equal(slugOf('???'), 'projeto');
  assert.ok(slugOf('palavra '.repeat(20)).length <= 48);
  assert.doesNotMatch(slugOf('palavra '.repeat(20)), /-$/);
});

test('strictly inside: a folder below the root, never the root itself, a sibling with the same prefix or an escape', () => {
  assert.equal(isStrictlyInside('/p', '/p/gatos'), true);
  assert.equal(isStrictlyInside('/p', '/p/'), false);
  assert.equal(isStrictlyInside('/p', '/projetos/gatos'), false);
  assert.equal(isStrictlyInside('/p', '/p/../etc'), false);
});
