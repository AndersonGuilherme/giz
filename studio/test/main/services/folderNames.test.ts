import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugOf } from '../../../src/main/services/folderNames.ts';

test('a folder name from a theme: lower case, no accents, words joined by "-", at most 48 characters', () => {
  assert.equal(slugOf('E se os gatos falassem?'), 'e-se-os-gatos-falassem');
  assert.equal(slugOf('Ação & Reação: São João'), 'acao-reacao-sao-joao');
  assert.equal(slugOf('../../etc'), 'etc');
  assert.equal(slugOf('???'), 'projeto');
  assert.ok(slugOf('palavra '.repeat(20)).length <= 48);
  assert.doesNotMatch(slugOf('palavra '.repeat(20)), /-$/);
});
