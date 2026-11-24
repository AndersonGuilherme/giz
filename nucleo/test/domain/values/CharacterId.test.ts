import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IdPersonagem } from '../../../src/dominio/valores/IdPersonagem.ts';

test('IdPersonagem aceita "ana-2" e recusa "Ana Maria"', () => {
  IdPersonagem.de('ana-2');
  assert.throws(() => IdPersonagem.de('Ana Maria'), /id de personagem/);
});
test('narrador é um id reservado', () => assert.ok(IdPersonagem.de('narrador').eNarrador()));
test('IdPersonagem recusa mais de 32 caracteres e vazio', () => {
  assert.throws(() => IdPersonagem.de('a'.repeat(33)), /id de personagem/);
  assert.throws(() => IdPersonagem.de(''), /id de personagem/);
});
test('igual compara pelo texto', () => {
  assert.ok(IdPersonagem.de('ana').igual(IdPersonagem.de('ana')));
  assert.ok(!IdPersonagem.de('ana').igual(IdPersonagem.NARRADOR));
  assert.equal(IdPersonagem.de('ana').texto(), 'ana');
});
