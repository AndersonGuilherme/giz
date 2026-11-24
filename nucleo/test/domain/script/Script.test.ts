import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Elenco } from '../../../src/dominio/elenco/Elenco.ts';
import { Personagem } from '../../../src/dominio/elenco/Personagem.ts';
import { Capitulo } from '../../../src/dominio/roteiro/Capitulo.ts';
import { Fala } from '../../../src/dominio/roteiro/Fala.ts';
import { Falas } from '../../../src/dominio/roteiro/Falas.ts';
import { Roteiro } from '../../../src/dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../../src/dominio/valores/IdPersonagem.ts';

const ana = Personagem.de(IdPersonagem.de('ana'), {
  nome: 'Ana', rig: 'teste', parametros: { pele: '#f0c8a0' }, voz: { id: 'ana' }, expressaoPadrao: 'neutra',
});
const elenco = Elenco.de([ana]);
const fala = (id: string, quem: string, capitulo = 1) =>
  Fala.de(IdPersonagem.de(quem), { id, capitulo: Capitulo.de(capitulo), texto: `fala ${id}` });

test('Elenco encontra o personagem pelo id', () => {
  assert.ok(elenco.contem(IdPersonagem.de('ana')));
  assert.equal(elenco.personagem(IdPersonagem.de('ana')), ana);
  assert.deepEqual(elenco.cadaUm(), [ana]);
});
test('Elenco recusa personagem ausente listando os ids', () => {
  assert.equal(elenco.contem(IdPersonagem.de('bia')), false);
  assert.throws(() => elenco.personagem(IdPersonagem.de('bia')), /"bia" não está no elenco \(ana\)/);
});
test('Personagem expõe a ficha por métodos', () => {
  assert.equal(ana.nome(), 'Ana');
  assert.equal(ana.rig(), 'teste');
  assert.deepEqual(ana.parametros(), { pele: '#f0c8a0' });
  assert.deepEqual(ana.voz(), { id: 'ana' });
  assert.equal(ana.expressaoPadrao(), 'neutra');
  assert.equal(ana.personalidade(), undefined);
  assert.ok(ana.temCorpo());
});
test('Narrador sem rig é voz sem corpo', () => {
  const narrador = Personagem.de(IdPersonagem.NARRADOR, { nome: 'Narrador', parametros: {}, voz: { id: 'n' }, expressaoPadrao: 'neutra' });
  assert.equal(narrador.temCorpo(), false);
  assert.equal(narrador.rig(), undefined);
});
test('Só o narrador pode não ter rig', () => {
  assert.throws(() => Personagem.de(IdPersonagem.de('bia'), { nome: 'Bia', parametros: {}, voz: { id: 'b' }, expressaoPadrao: 'neutra' }),
    /"bia" precisa de um rig/);
});
test('Fala expõe seus dados por métodos, com pronúncia e marcas padrão', () => {
  const f = fala('7', 'ana', 2);
  assert.equal(f.id(), '7');
  assert.equal(f.capitulo().numero(), 2);
  assert.equal(f.texto(), 'fala 7');
  assert.equal(f.pronuncia(), 'fala 7');
  assert.deepEqual(f.marcas(), []);
  assert.equal(f.cena(), undefined);
  assert.equal(f.pose(), undefined);
  assert.equal(f.expressao(), undefined);
  assert.equal(f.olhar(), undefined);
  assert.equal(f.reacao(), undefined);
  assert.equal(f.pausaDepois(), undefined);
  assert.equal(f.efeitoSonoro(), undefined);
  assert.ok(f.quem().igual(IdPersonagem.de('ana')));
});
test('Fala usa a pronúncia quando há', () => {
  const f = Fala.de(IdPersonagem.de('ana'), { id: '1', capitulo: Capitulo.de(1), texto: 'deploy', pronuncia: 'diplói' });
  assert.equal(f.pronuncia(), 'diplói');
});
test('Capitulo recusa número menor que 1 ou não inteiro', () => {
  assert.throws(() => Capitulo.de(0), /capítulo 0 inválido/);
  assert.throws(() => Capitulo.de(1.5), /capítulo 1.5 inválido/);
});
test('Falas conta e percorre as falas', () => {
  const falas = Falas.de([fala('1', 'ana'), fala('2', 'ana')]);
  assert.equal(falas.quantidade(), 2);
  assert.deepEqual(falas.cadaUma().map((f) => f.id()), ['1', '2']);
});
test('Falas recusa ids repetidos', () => {
  assert.throws(() => Falas.de([fala('1', 'ana'), fala('1', 'ana')]), /id "1" repetido/);
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
test('Roteiro recusa fala em capítulo inexistente', () => {
  assert.throws(() => Roteiro.de(['Abertura'], Falas.de([fala('1', 'ana', 3)])), /fala 1: capítulo 3 não existe \(há 1\)/);
});
