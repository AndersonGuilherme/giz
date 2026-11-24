import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Language } from '../../../src/domain/values/Language.ts';
import { VisemeMap, VisemeSequence } from '../../../src/domain/speech/Visemes.ts';

const seq = (text: string) => VisemeMap.for(Language.PORTUGUESE).convert(text);

test('pt-BR: "mapa" (ˈmapɐ) becomes MAMA', () => assert.equal(VisemeMap.for(Language.PORTUGUESE).convert('ˈmapɐ').text(), 'MAMA'));
test('en: "mama" (mˈɑːmə) becomes MAME', () => assert.equal(VisemeMap.for(Language.ENGLISH).convert('mˈɑːmə').text(), 'MAME'));
test('en: θ ð become C, ʌ æ become A, ɜ ɚ become E, w becomes U', () => {
  const english = VisemeMap.for(Language.ENGLISH);
  assert.equal(english.convert('θðʌæɜɚw').text(), 'CCAAEEU');
});
test('pt-BR: ʌ has no rule of its own and becomes C', () => assert.equal(seq('ʌ').text(), 'C'));
test('ignores spaces, punctuation, stress marks and length marks', () => assert.equal(seq('ˈa ˌe, i.ː!').text(), 'AEI'));
test('spreads 3 visemes over 6 voiced frames and keeps X in silence', () => {
  assert.equal(seq('aei').spreadOver([false, true, true, true, true, true, true, false]), 'XAAEEIIX');
});
test('without visemes, every frame is X', () => assert.equal(seq('').spreadOver([true, false, true]), 'XXX'));
test('without voiced frames, everything is X', () => assert.equal(seq('ae').spreadOver([false, false]), 'XX'));
test('VisemeSequence is exported', () => assert.equal(typeof VisemeSequence, 'function'));
