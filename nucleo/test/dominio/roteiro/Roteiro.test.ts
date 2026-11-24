import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Elenco } from '../../../src/dominio/elenco/Elenco.ts';
import { Personagem } from '../../../src/dominio/elenco/Personagem.ts';
import { Fala } from '../../../src/dominio/roteiro/Fala.ts';
import { Falas } from '../../../src/dominio/roteiro/Falas.ts';
import { Roteiro } from '../../../src/dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../../src/dominio/valores/IdPersonagem.ts';

const ana = Personagem.de(IdPersonagem.de('ana'), {
  nome: 'Ana', rig: 'teste', parametros: {}, voz: { id: 'ana' }, expressaoPadrao: 'neutra',
});
const elenco = Elenco.de([ana]);
const fala = (id: string, quem: string) => Fala.de(IdPersonagem.de(quem), { id, capitulo: 1, texto: `fala ${id}` });

test('Elenco encontra o personagem pelo id', () => {
  assert.ok(elenco.contem(IdPersonagem.de('ana')));
  assert.equal(elenco.personagem(IdPersonagem.de('ana')), ana);
  assert.deepEqual(elenco.cadaUm(), [ana]);
});
test('Elenco recusa personagem ausente listando os ids', () => {
  assert.equal(elenco.contem(IdPersonagem.de('bia')), false);
  assert.throws(() => elenco.personagem(IdPersonagem.de('bia')), /"bia" não está no elenco \(ana\)/);
});
test('Falas conta e percorre as falas', () => {
  const falas = Falas.de([fala('1', 'ana'), fala('2', 'ana')]);
  assert.equal(falas.quantidade(), 2);
  assert.deepEqual(falas.cadaUma().map((f) => f.dados().id), ['1', '2']);
});
test('Falas lista os ids fora do elenco sem repetir', () => {
  const falas = Falas.de([fala('1', 'bia'), fala('2', 'ana'), fala('3', 'bia'), fala('4', 'caio')]);
  assert.deepEqual(falas.idsDesconhecidos(elenco), ['bia', 'caio']);
});
test('Roteiro expõe capítulos e falas', () => {
  const r = Roteiro.de(['Abertura'], Falas.de([fala('1', 'ana')]));
  assert.deepEqual(r.capitulos(), ['Abertura']);
  assert.equal(r.falas().quantidade(), 1);
});
test('Roteiro recusa roteiro sem capítulos', () => {
  assert.throws(() => Roteiro.de([], Falas.de([])), /capítulo/);
});
