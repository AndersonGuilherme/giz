import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VerificarProjeto } from '../../src/aplicacao/casos-de-uso/VerificarProjeto.ts';
import { Elenco } from '../../src/dominio/elenco/Elenco.ts';
import { Personagem } from '../../src/dominio/elenco/Personagem.ts';
import { Caixa } from '../../src/dominio/layout/Caixa.ts';
import { Caixas } from '../../src/dominio/layout/Caixas.ts';
import { RegistroDeLayouts } from '../../src/dominio/layout/RegistroDeLayouts.ts';
import { criarRegistroDeLayouts } from '../../src/dominio/layout/registroPadrao.ts';
import { Projeto } from '../../src/dominio/projeto/Projeto.ts';
import { Capitulo } from '../../src/dominio/roteiro/Capitulo.ts';
import type { Cena } from '../../src/dominio/roteiro/Cena.ts';
import { Fala } from '../../src/dominio/roteiro/Fala.ts';
import { Falas } from '../../src/dominio/roteiro/Falas.ts';
import { Roteiro } from '../../src/dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../src/dominio/valores/IdPersonagem.ts';
import { Idioma } from '../../src/dominio/valores/Idioma.ts';
import { Proporcao } from '../../src/dominio/valores/Proporcao.ts';

type FalaDeTeste = { texto?: string; cena?: Cena };

function projeto(falas: FalaDeTeste[], proporcao: string, avisos: string[] = []): Projeto {
  const ana = IdPersonagem.de('ana');
  const personagem = Personagem.de(ana, { nome: 'Ana', rig: 'teste', parametros: {}, voz: { id: 'vivian' }, expressaoPadrao: 'neutra' });
  const lista = falas.map(({ texto = 'Olá.', cena }, i) => Fala.de(ana, { id: String(i + 1), capitulo: Capitulo.de(1), texto, cena }));
  return Projeto.de(
    { titulo: 'T', formato: 'aula', idioma: Idioma.PORTUGUES, proporcao: Proporcao.de(proporcao), estiloDeLegenda: 'blocos', voz: { provedor: 'qwen' } },
    { elenco: Elenco.de([personagem]), roteiro: Roteiro.de(['Abertura'], Falas.de(lista)), avisos },
  );
}

const titulo = (texto: string): Cena => ({ tipo: 'titulo', sobretitulo: 'Aula 1', titulo: texto, subtitulo: 'Uma introdução' });
const projetoComTitulo = (texto: string, proporcao: string) => projeto([{ cena: titulo(texto) }], proporcao);
const verificar = (p: Projeto, layouts = criarRegistroDeLayouts()) => new VerificarProjeto({ layouts }).executar(p);

test('título de 80 caracteres sem espaço não cabe e vira erro no check', () => {
  const r = verificar(projetoComTitulo('A'.repeat(80), '9:16'));
  assert.equal(r.erros.length, 1);
  assert.equal(r.erros[0].fala, '1');
  assert.match(r.erros[0].mensagem, /título não cabe/);
});
test('título normal passa sem problemas nas duas proporções', () => {
  for (const proporcao of ['9:16', '16:9']) {
    assert.deepEqual(verificar(projetoComTitulo('Arquitetura hexagonal na prática', proporcao)), { erros: [], avisos: [] });
  }
});
test('legenda que não cabe vira erro da fala', () => {
  const r = verificar(projeto([{ texto: 'palavra '.repeat(80) }], '9:16'));
  assert.deepEqual(r.erros.map((e) => [e.fala, e.mensagem]), [['1', 'legenda não cabe na caixa nem com a letra a 60%']]);
});
test('cena herdada não repete o erro e cena sem layout é pulada', () => {
  const r = verificar(projeto([{ cena: titulo('A'.repeat(80)) }, {}, { cena: { tipo: 'citacao', texto: 'x' } }], '9:16'));
  assert.deepEqual(r.erros.map((e) => e.fala), ['1']);
});
test('sobreposição e saída da área segura viram erro com os rótulos', () => {
  const layouts = RegistroDeLayouts.vazio();
  layouts.registrar('citacao', () => Caixas.de([
    Caixa.de('aspas', { x: 0, y: 0, largura: 200, altura: 200 }),
    Caixa.de('autor', { x: 200, y: 1300, largura: 600, altura: 100 }),
  ]));
  const r = verificar(projeto([{ cena: { tipo: 'citacao', texto: 'x' } }], '9:16'), layouts);
  assert.deepEqual(r.erros.map((e) => e.mensagem), ['autor sobrepõe legenda', 'aspas sai da área segura']);
});
test('avisos do projeto (imagem ausente) entram como aviso', () => {
  const r = verificar(projeto([{}], '9:16', ['fundo.png não encontrada (fala 1)']));
  assert.deepEqual(r, { erros: [], avisos: [{ fala: '', mensagem: 'fundo.png não encontrada (fala 1)' }] });
});
