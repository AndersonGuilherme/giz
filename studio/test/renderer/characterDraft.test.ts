import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accepts, drawableParameters, parametersOf, withParameter, withRig } from '../../src/renderer/cast/characterDraft.ts';
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

// User bugs #1: Lia's skin is a color and Giz's a named tone; a rig switch kept the value by name only.
const liaColors: RigInfo = { id: 'lia-style', name: { 'pt-BR': 'Estilo Lia', en: 'Lia style' }, parameters: { skin: { type: 'color', defaultValue: '#FDD6B0' }, glasses: { type: 'boolean', defaultValue: true } } };

test('another rig keeps a parameter only when its value fits that rig (a color skin is not a named tone)', () => {
  const lia = withRig({ ...ana, parameters: { skin: 'deep', glasses: false } }, liaColors);
  assert.deepEqual(lia.parameters, { glasses: false }, 'the tone "deep" is not a color: Lia uses its default skin');
  const back = withRig({ ...lia, parameters: { skin: '#ffffff', glasses: false } }, giz);
  assert.deepEqual(back.parameters, { glasses: false }, 'the color "#ffffff" is not a Giz tone: Giz uses its default skin');
});

test('a value fits a parameter as core checks it', () => {
  assert.equal(accepts({ type: 'option', defaultValue: 'a', options: ['a', 'b'] }, 'b'), true);
  assert.equal(accepts({ type: 'option', defaultValue: 'a', options: ['a', 'b'] }, '#ffffff'), false);
  assert.equal(accepts({ type: 'color', defaultValue: 'auto' }, 'auto'), true);
  assert.equal(accepts({ type: 'color', defaultValue: '#000' }, '#ABC'), true);
  assert.equal(accepts({ type: 'color', defaultValue: '#000' }, 'tan'), false);
  assert.equal(accepts({ type: 'number', defaultValue: 1, min: 0.8, max: 1.4 }, 1.5), false);
  assert.equal(accepts({ type: 'number', defaultValue: 1, min: 0.8, max: 1.4 }, 1.2), true);
  assert.equal(accepts({ type: 'boolean', defaultValue: false }, 'yes'), false);
});

test('the drawing gets only values its rig can draw: a wrong one is drawn with the default and named', () => {
  const drawn = drawableParameters({ ...ana, parameters: { skin: '#ffffff', glasses: true, wings: true } }, giz);
  assert.deepEqual(drawn.parameters, { skin: 'light', glasses: true });
  assert.deepEqual(drawn.wrong, ['skin', 'wings']);
});
