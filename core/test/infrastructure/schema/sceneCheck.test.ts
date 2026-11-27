import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE_TYPES, sceneProblems } from '../../../src/infrastructure/schema/sceneCheck.ts';

test('the scene types are read from the schemas', () => {
  assert.deepEqual(SCENE_TYPES, ['scenario', 'title', 'card', 'quote', 'chart', 'symptoms', 'code', 'terminal', 'graph', 'versus', 'table', 'talk', 'house', 'inbox']);
});

test('a valid scene has no problems', () => {
  assert.deepEqual(sceneProblems({ type: 'scenario', background: { vector: 'street' }, characters: [] }), []);
  assert.deepEqual(sceneProblems({ type: 'talk' }), []);
});

test('an invalid scene gets the readable pt-BR problems, with paths from the scene', () => {
  assert.deepEqual(sceneProblems({ type: 'card', variant: 'roxo', title: 'x', items: [], extra: 1 }), [
    { file: 'scene', path: 'variant', message: '"roxo" inválido (use objective, summary, challenge, next, ticket, rule)' },
    { file: 'scene', path: 'extra', message: 'campo desconhecido' },
  ]);
  assert.deepEqual(sceneProblems({ type: 'dance' }).map(({ message }) => message), [`tipo inválido (use ${SCENE_TYPES.join(', ')})`]);
  assert.deepEqual(sceneProblems({ type: 'scenario', background: { vector: 'street', colors: { nope: '#000000' } }, characters: [] })[0]?.path, 'background.colors.nope');
});
