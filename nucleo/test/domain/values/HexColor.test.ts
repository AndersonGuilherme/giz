import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CorHex } from '../../../src/dominio/valores/CorHex.ts';

test('CorHex recusa nome de cor com mensagem', () => assert.throws(() => CorHex.de('roxo'), /cor "roxo".*#RRGGBB/));
test('CorHex escurece #ffffff em 50% para #808080', () => assert.equal(CorHex.de('#ffffff').escurecida(0.5).css(), '#808080'));
test('CorHex expande #RGB e normaliza para minúsculas', () => assert.equal(CorHex.de('#FA0').css(), '#ffaa00'));
test('CorHex recusa fator fora de 0 a 1', () => assert.throws(() => CorHex.de('#ffffff').escurecida(1.5), /fator/));
