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

test('a scenario picture may carry its crop (zoom and focus); a crop out of range is a readable error at its path', () => {
  const scene = (crop: object) => ({ type: 'scenario', background: { image: 'scenes/own/1.png', crop }, characters: [] });
  assert.deepEqual(sceneProblems(scene({ zoom: 1.6, x: 0.2, y: 0.8 })), []);
  const [problem] = sceneProblems(scene({ zoom: 9, x: 0.2, y: 0.8 }));
  assert.equal(problem!.path, 'background.crop');
  assert.match(problem!.message, /recorte: zoom deve ir de 1 a 4/);
  assert.equal(sceneProblems(scene({ zoom: 1, x: 0.5, y: 0.5, w: 1 }))[0]!.path, 'background.crop.w');
});
