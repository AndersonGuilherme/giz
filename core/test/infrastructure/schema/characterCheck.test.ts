import { test } from 'node:test';
import assert from 'node:assert/strict';
import { characterProblems } from '../../../src/infrastructure/schema/characterCheck.ts';
import { FakeRigCatalog } from '../../doubles/FakeRigCatalog.ts';

const valid = { id: 'ana', name: 'Ana', rig: 'test', parameters: { skin: '#aa8866' }, voice: { id: 'vivian' }, defaultExpression: 'happy' };
const catalog = new FakeRigCatalog();

test('a valid character has no problems', () => {
  assert.deepEqual(characterProblems(valid, catalog), []);
});

test('each wrong field says where and why, in pt-BR (schema and rig parameters together)', () => {
  const json = { ...valid, name: '', parameters: { skin: 'roxo', height: 3, hair: 'mohawk', wings: true }, defaultExpression: 'sleepy' };
  const problems = characterProblems(json, catalog);
  const byPath = Object.fromEntries(problems.map(({ path, message }) => [path, message]));
  assert.equal(byPath.name, 'não pode ser vazio');
  assert.match(byPath.defaultExpression!, /"sleepy" inválido/);
  assert.equal(problems.every(({ file }) => file === 'character'), true);
});

test('rig parameters are checked when the schema passes: color, range, option and unknown names', () => {
  const json = { ...valid, parameters: { skin: 'roxo', height: 3, hair: 'mohawk', wings: true } };
  const paths = characterProblems(json, catalog).map(({ path, message }) => `${path}: ${message}`);
  assert.equal(paths.length, 4);
  assert.match(paths.join('\n'), /parameters\.skin: .*roxo/);
  assert.match(paths.join('\n'), /parameters\.height: número 3 fora de 0.5 a 1.5/);
  assert.match(paths.join('\n'), /parameters\.hair: opção "mohawk" inválida/);
  assert.match(paths.join('\n'), /parameters\.wings: parâmetro desconhecido/);
});

test('an unknown rig, and a body without rig that is not the narrator', () => {
  assert.match(characterProblems({ ...valid, rig: 'dragon' }, catalog)[0]!.message, /rig "dragon" desconhecido/);
  const withoutRig = { id: 'ana', name: 'Ana', voice: { id: 'vivian' }, defaultExpression: 'happy' };
  assert.equal(characterProblems(withoutRig, catalog)[0]!.path, 'rig');
  assert.deepEqual(characterProblems({ id: 'narrator', name: 'Narrador', voice: { id: 'ryan' }, defaultExpression: 'neutral' }, catalog), []);
});
