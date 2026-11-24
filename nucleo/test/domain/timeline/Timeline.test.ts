import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LinhaDoTempo } from '../../../src/dominio/linha-do-tempo/LinhaDoTempo.ts';
import type { PropsDoVideo, TrechoJson } from '../../../src/dominio/linha-do-tempo/PropsDoVideo.ts';
import { IdPersonagem } from '../../../src/dominio/valores/IdPersonagem.ts';
import { Quadro } from '../../../src/dominio/valores/Tempo.ts';

const ana = IdPersonagem.de('ana');
const teo = IdPersonagem.de('teo');

function trecho(dados: Partial<TrechoJson>): TrechoJson {
  return {
    idFala: '1', quem: 'ana', inicio: 0, duracaoDaFala: 10, duracaoTotal: 20, cena: { tipo: 'conversa' }, chaveDaCena: 0, palavras: [], marcas: [],
    estados: { ana: { pose: 'explicar', expressao: 'feliz', olhar: 'outro' }, teo: { pose: 'pensar', expressao: 'cetica', olhar: 'outro' } },
    audio: 'voz/1.wav', envelope: [0, 0.2, 0.4, 0.6, 0.8, 1, 0.8, 0.6, 0.4, 0.2], visemas: 'XMAEIOUFCA',
    ...dados,
  };
}

function linha(trechos: TrechoJson[]): LinhaDoTempo {
  const props: PropsDoVideo = {
    fps: 30, largura: 1080, altura: 1920, idioma: 'pt-BR', formato: 'historia', estiloDeLegenda: 'palavras', titulo: 'T', capitulos: ['A'],
    totalDeQuadros: trechos.reduce((soma, atual) => soma + atual.duracaoTotal, 0), trechos, elenco: [], efeitosSonoros: [],
  };
  return LinhaDoTempo.de(props);
}

test('quem fala mexe a boca pelo visema e pelo envelope do quadro', () => {
  const estado = linha([trecho({})]).estadoDe(ana, Quadro.de(4));
  assert.equal(estado.estaFalando(), true);
  assert.equal(estado.visema(), 'I');
  assert.equal(estado.abertura(), 0.8);
  assert.equal(estado.pose(), 'explicar');
  assert.equal(estado.expressao(), 'feliz');
});

test('na pausa depois da fala a boca fica em repouso', () => {
  const estado = linha([trecho({})]).estadoDe(ana, Quadro.de(15));
  assert.equal(estado.estaFalando(), false);
  assert.equal(estado.visema(), 'X');
  assert.equal(estado.abertura(), 0);
});

test('quem escuta usa o estado de ouvinte e não fala', () => {
  const estado = linha([trecho({})]).estadoDe(teo, Quadro.de(4));
  assert.equal(estado.estaFalando(), false);
  assert.equal(estado.pose(), 'pensar');
  assert.equal(estado.expressao(), 'cetica');
});

test('a marca muda a expressão e a pose de quem fala a partir do seu quadro', () => {
  const linhaDoTempo = linha([trecho({ marcas: [{ quadro: 5, mudancas: { expressao: 'surpresa', pose: 'apontar' } }] })]);
  assert.equal(linhaDoTempo.estadoDe(ana, Quadro.de(4)).expressao(), 'feliz');
  const depois = linhaDoTempo.estadoDe(ana, Quadro.de(5));
  assert.equal(depois.expressao(), 'surpresa');
  assert.equal(depois.pose(), 'apontar');
  assert.equal(linhaDoTempo.estadoDe(teo, Quadro.de(6)).expressao(), 'cetica');
});

test('o quadro cai no trecho certo', () => {
  const segundo = trecho({ idFala: '2', quem: 'teo', inicio: 20, estados: { ana: { pose: 'neutra', expressao: 'neutra', olhar: 'outro' }, teo: { pose: 'acenar', expressao: 'feliz', olhar: 'camera' } } });
  const linhaDoTempo = linha([trecho({}), segundo]);
  assert.equal(linhaDoTempo.estadoDe(teo, Quadro.de(22)).estaFalando(), true);
  assert.equal(linhaDoTempo.estadoDe(teo, Quadro.de(22)).olhaPara(), 'camera');
  assert.equal(linhaDoTempo.estadoDe(ana, Quadro.de(22)).estaFalando(), false);
});

test('o gesto da pose não recomeça quando a pose continua na fala seguinte', () => {
  const segundo = trecho({ idFala: '2', inicio: 20 });
  const continua = linha([trecho({}), segundo]).estadoDe(ana, Quadro.de(21));
  const recomeca = linha([trecho({ estados: { ana: { pose: 'neutra', expressao: 'feliz', olhar: 'outro' } } }), segundo]).estadoDe(ana, Quadro.de(21));
  assert.notDeepEqual(continua.deslocamentoDoCorpo(), recomeca.deslocamentoDoCorpo());
});

test('quem não tem corpo (o narrador) não tem estado', () => {
  assert.throws(() => linha([trecho({ quem: 'narrador' })]).estadoDe(IdPersonagem.NARRADOR, Quadro.de(2)), /narrador.*sem estado/);
});
