import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Idioma } from '../../../src/dominio/valores/Idioma.ts';
import { MapaDeVisemas, SequenciaDeVisemas } from '../../../src/dominio/fala/Visemas.ts';

const seq = (texto: string) => MapaDeVisemas.para(Idioma.PORTUGUES).converter(texto);

test('pt-BR: "mapa" (ˈmapɐ) vira MAMA', () => assert.equal(MapaDeVisemas.para(Idioma.PORTUGUES).converter('ˈmapɐ').texto(), 'MAMA'));
test('en: "mama" (mˈɑːmə) vira MAME', () => assert.equal(MapaDeVisemas.para(Idioma.INGLES).converter('mˈɑːmə').texto(), 'MAME'));
test('en: θ ð viram C, ʌ æ viram A, ɜ ɚ viram E, w vira U', () => {
  const ingles = MapaDeVisemas.para(Idioma.INGLES);
  assert.equal(ingles.converter('θðʌæɜɚw').texto(), 'CCAAEEU');
});
test('pt-BR: ʌ não tem regra própria e vira C', () => assert.equal(seq('ʌ').texto(), 'C'));
test('ignora espaços, pontuação, acentos tônicos e marcas de duração', () => assert.equal(seq('ˈa ˌe, i.ː!').texto(), 'AEI'));
test('espalha 3 visemas sobre 6 quadros com voz e mantém X no silêncio', () => {
  assert.equal(seq('aei').espalharSobre([false, true, true, true, true, true, true, false]), 'XAAEEIIX');
});
test('sem visemas, todos os quadros ficam em X', () => assert.equal(seq('').espalharSobre([true, false, true]), 'XXX'));
test('sem quadros com voz, tudo é X', () => assert.equal(seq('ae').espalharSobre([false, false]), 'XX'));
test('SequenciaDeVisemas é exportada', () => assert.equal(typeof SequenciaDeVisemas, 'function'));
