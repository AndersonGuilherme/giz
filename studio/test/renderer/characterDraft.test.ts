import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parametersOf, withParameter, withRig } from '../../src/renderer/cast/characterDraft.ts';
import type { CharacterFile, RigInfo } from '../../src/shared/cast.ts';

const giz: RigInfo = { id: 'giz', name: { 'pt-BR': 'Giz', en: 'Giz' }, parameters: { skin: { type: 'option', defaultValue: 'light', options: ['light', 'deep'] }, glasses: { type: 'boolean', defaultValue: false } } };
const lia: RigInfo = { id: 'lia-style', name: { 'pt-BR': 'Estilo Lia', en: 'Lia style' }, parameters: { glasses: { type: 'boolean', defaultValue: true } } };
const ana: CharacterFile = { id: 'ana', name: 'Ana', rig: 'giz', parameters: { skin: 'deep' }, voice: { id: 'vivian' }, defaultExpression: 'happy' };

test('the controls show every parameter: the chosen ones and the defaults', () => {
  assert.deepEqual(parametersOf(ana, giz), { skin: 'deep', glasses: false });
});

test('a parameter set back to its default leaves the file', () => {
  const withGlasses = withParameter(ana, giz, { name: 'glasses', value: true });
  assert.deepEqual(withGlasses.parameters, { skin: 'deep', glasses: true });
  assert.deepEqual(withParameter(withGlasses, giz, { name: 'skin', value: 'light' }).parameters, { glasses: true });
});

test('another rig keeps only the parameters it has', () => {
  const changed = withRig({ ...ana, parameters: { skin: 'deep', glasses: true } }, lia);
  assert.deepEqual([changed.rig, changed.parameters], ['lia-style', { glasses: true }]);
});
