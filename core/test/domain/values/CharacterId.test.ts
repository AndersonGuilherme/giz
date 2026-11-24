import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';

test('CharacterId accepts "ana-2" and rejects "Ana Maria"', () => {
  CharacterId.of('ana-2');
  assert.throws(() => CharacterId.of('Ana Maria'), /id de personagem/);
});
test('narrator is a reserved id', () => assert.ok(CharacterId.of('narrator').isNarrator()));
test('CharacterId rejects more than 32 characters and empty', () => {
  assert.throws(() => CharacterId.of('a'.repeat(33)), /id de personagem/);
  assert.throws(() => CharacterId.of(''), /id de personagem/);
});
test('equals compares by text', () => {
  assert.ok(CharacterId.of('ana').equals(CharacterId.of('ana')));
  assert.ok(!CharacterId.of('ana').equals(CharacterId.NARRATOR));
  assert.equal(CharacterId.of('ana').text(), 'ana');
});
