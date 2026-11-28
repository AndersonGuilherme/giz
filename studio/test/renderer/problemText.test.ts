import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemLine } from '../../src/renderer/cast/problemText.ts';
import { translator } from '../../src/shared/i18n/translate.ts';
import type { CharacterFile, RigInfo } from '../../src/shared/cast.ts';

// User bugs #1: the save refusal showed core's raw path and option ids ("parameters.skin opção "#ffffff" inválida (use light, …)").
const gizzy: RigInfo = {
  id: 'gizzy', name: { 'pt-BR': 'Gizzy', en: 'Gizzy' },
  parameters: { skin: { type: 'option', defaultValue: 'medium', options: ['light', 'medium'] }, hairColor: { type: 'color', defaultValue: '#3a2418' }, eyeScale: { type: 'number', defaultValue: 1, min: 0.8, max: 1.4 } },
};
const lu: CharacterFile = { id: 'lu', name: 'Lu', rig: 'gizzy', parameters: { skin: '#ffffff', hairColor: 'branco', eyeScale: 3, wings: true }, voice: { id: 'vivian' }, defaultExpression: 'happy' };
const core = (name: string) => ({ path: `parameters.${name}`, message: 'core message' });

test('a parameter problem names the field and the value as the editor shows them, in the interface language', () => {
  const portuguese = translator('pt-BR');
  assert.deepEqual(problemLine(portuguese, core('skin'), { file: lu, rig: gizzy }), { field: 'Pele', text: '“#ffffff” não é uma das opções do modelo Gizzy: escolha uma na lista.' });
  assert.deepEqual(problemLine(portuguese, core('hairColor'), { file: lu, rig: gizzy }), { field: 'Cor do cabelo', text: '“branco” não é uma cor: escolha uma no seletor.' });
  assert.deepEqual(problemLine(portuguese, core('eyeScale'), { file: lu, rig: gizzy }), { field: 'Tamanho dos olhos', text: '3 está fora do intervalo de 0.8 a 1.4.' });
  assert.deepEqual(problemLine(portuguese, core('wings'), { file: lu, rig: gizzy }), { field: 'wings', text: 'O modelo Gizzy não tem este ajuste.' });
  const english = translator('en');
  assert.deepEqual(problemLine(english, core('skin'), { file: lu, rig: gizzy }), { field: 'Skin', text: '“#ffffff” is not one of the Gizzy model’s options: pick one from the list.' });
});

test('a usual expression the list does not have is said in words too', () => {
  const file = { ...lu, defaultExpression: 'bogus' };
  assert.deepEqual(problemLine(translator('pt-BR'), { path: 'defaultExpression', message: '"bogus" inválido (use neutral, …)' }, { file, rig: gizzy }), { field: 'Expressão de sempre', text: '“bogus” não é uma das expressões: escolha uma na lista.' });
});

test('another problem keeps core\'s message, under the field\'s name when the editor has one', () => {
  const portuguese = translator('pt-BR');
  assert.deepEqual(problemLine(portuguese, { path: 'name', message: 'obrigatório' }, { file: lu, rig: gizzy }), { field: 'Nome', text: 'obrigatório' });
  assert.deepEqual(problemLine(portuguese, { path: 'voice.extra', message: 'desconhecido' }, { file: lu, rig: gizzy }), { field: 'voice.extra', text: 'desconhecido' });
});
