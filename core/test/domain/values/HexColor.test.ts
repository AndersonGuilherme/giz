import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HexColor } from '../../../src/domain/values/HexColor.ts';

test('HexColor rejects a color name with a message', () => assert.throws(() => HexColor.of('roxo'), /cor "roxo".*#RRGGBB/));
test('HexColor darkens #ffffff by 50% to #808080', () => assert.equal(HexColor.of('#ffffff').darkened(0.5).css(), '#808080'));
test('HexColor expands #RGB and normalizes to lowercase', () => assert.equal(HexColor.of('#FA0').css(), '#ffaa00'));
test('HexColor rejects a factor outside 0 to 1', () => assert.throws(() => HexColor.of('#ffffff').darkened(1.5), /fator/));
