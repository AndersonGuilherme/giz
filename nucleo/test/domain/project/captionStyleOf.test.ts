import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captionStyleOf } from '../../../src/domain/project/Project.ts';

test('without a declared style a story speaks word by word and a lesson in blocks', () => {
  assert.equal(captionStyleOf('story'), 'words');
  assert.equal(captionStyleOf('lesson'), 'blocks');
});

test('a declared style wins in either format', () => {
  assert.equal(captionStyleOf('story', 'blocks'), 'blocks');
  assert.equal(captionStyleOf('lesson', 'words'), 'words');
});
