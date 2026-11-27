import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkScene, scriptVocabulary } from '../../../src/presentation/cli/composition/editing.ts';

test('the editor vocabulary comes from the domain lists', () => {
  const vocabulary = scriptVocabulary();
  assert.ok(vocabulary.poses.includes('hands-on-mouth'));
  assert.deepEqual(vocabulary.looks, ['camera', 'other', 'content']);
  assert.ok(vocabulary.sounds.includes('whoosh'));
  assert.ok(vocabulary.backgrounds.includes('haunted-house'));
  assert.equal(vocabulary.sceneTypes[0], 'scenario');
});

test('checkScene answers the scene problems', () => {
  assert.deepEqual(checkScene({ type: 'quote', text: '' }), [{ file: 'scene', path: 'text', message: 'não pode ser vazio' }]);
});
