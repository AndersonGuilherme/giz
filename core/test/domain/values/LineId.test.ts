import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LineId } from '../../../src/domain/values/LineId.ts';

test('a line id names files (voice/<id>.wav): letters, digits, "_" and "-", 1 to 32 characters', () => {
  assert.equal(LineId.of('001').text(), '001');
  assert.equal(LineId.of('Intro_2-b').text(), 'Intro_2-b');
  assert.throws(() => LineId.of('../x'), /id de fala "\.\.\/x" inválido \(use de 1 a 32 caracteres entre A-Z, a-z, 0-9, "_" e "-"\)/);
  assert.throws(() => LineId.of('a/b'), /id de fala "a\/b" inválido/);
  assert.throws(() => LineId.of(''), /id de fala "" inválido/);
  assert.throws(() => LineId.of('x'.repeat(33)), /id de fala/);
});
