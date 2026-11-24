import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Idioma } from '../../../src/dominio/valores/Idioma.ts';

test('Idioma aceita pt-BR e en e diz a voz do espeak', () => {
  assert.equal(Idioma.de('pt-BR').vozEspeak(), 'pt-br');
  assert.equal(Idioma.de('en').vozEspeak(), 'en-us');
  assert.ok(Idioma.de('en').igual(Idioma.INGLES));
});
test('Idioma recusa código desconhecido com mensagem legível', () => {
  assert.throws(() => Idioma.de('es'), { name: 'ErroDeDominio', message: /idioma "es" não suportado.*pt-BR.*en/ });
});
