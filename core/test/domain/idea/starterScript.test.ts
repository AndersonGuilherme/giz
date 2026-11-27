import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narratorOf, stagedCharacters, starterTexts, starterTitle } from '../../../src/domain/idea/starterScript.ts';
import { Placement } from '../../../src/domain/scenario/Placement.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Language } from '../../../src/domain/values/Language.ts';

test('the title is the first line of the theme, cut on a word at 80 characters', () => {
  assert.equal(starterTitle('  E se os gatos falassem?\nmais detalhes'), 'E se os gatos falassem?');
  const long = 'uma história muito longa sobre um gato que acorda falando e decide abrir uma padaria no centro da cidade';
  const title = starterTitle(long);
  assert.ok(title.length <= 80, title);
  assert.ok(title.endsWith('…'));
  assert.ok(long.startsWith(title.slice(0, -1)));
});

test('the starter texts and the narrator speak the language of the project', () => {
  assert.equal(starterTexts(Language.of('pt-BR')).line, 'Escreva aqui a primeira fala.');
  assert.equal(starterTexts(Language.of('en')).chapter, 'Beginning');
  assert.deepEqual(narratorOf(Language.of('en')), {
    id: 'narrator', name: 'Narrator', voice: { id: 'ryan', style: 'Speak in natural American English' }, personality: 'narrator without a body', defaultExpression: 'neutral',
  });
});

test('the characters on stage fill the named positions, up to the limit of the aspect', () => {
  assert.equal(Placement.limitOf(AspectRatio.VERTICAL), 2);
  assert.equal(Placement.limitOf(AspectRatio.HORIZONTAL), 3);
  assert.deepEqual(stagedCharacters(['bia'], AspectRatio.VERTICAL), [{ character: 'bia', position: 'center' }]);
  assert.deepEqual(stagedCharacters(['bia', 'caio', 'yumi'], AspectRatio.VERTICAL), [{ character: 'bia', position: 'left' }, { character: 'caio', position: 'right' }]);
  assert.deepEqual(stagedCharacters(['bia', 'caio', 'yumi'], AspectRatio.HORIZONTAL).map(({ position }) => position), ['left', 'center', 'right']);
});
