import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { VozGravada } from '../../src/aplicacao/portas/ArmazemDeVozes.ts';
import { MontarLinhaDoTempo } from '../../src/aplicacao/casos-de-uso/MontarLinhaDoTempo.ts';
import { Elenco } from '../../src/dominio/elenco/Elenco.ts';
import { Personagem } from '../../src/dominio/elenco/Personagem.ts';
import type { PalavraJson } from '../../src/dominio/fala/PalavraJson.ts';
import { Projeto } from '../../src/dominio/projeto/Projeto.ts';
import { Capitulo } from '../../src/dominio/roteiro/Capitulo.ts';
import type { Cena } from '../../src/dominio/roteiro/Cena.ts';
import { Fala, type DadosDaFala } from '../../src/dominio/roteiro/Fala.ts';
import { Falas } from '../../src/dominio/roteiro/Falas.ts';
import { Roteiro } from '../../src/dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../src/dominio/valores/IdPersonagem.ts';
import { Idioma } from '../../src/dominio/valores/Idioma.ts';
import { Proporcao } from '../../src/dominio/valores/Proporcao.ts';
import { ArmazemEmMemoria } from '../dublês/ArmazemEmMemoria.ts';

type FalaDeTeste = Omit<DadosDaFala, 'capitulo'> & { quem?: string };

const RESPIRO = 11; // 0,35 s a 30 fps
const titulo: Cena = { tipo: 'titulo', sobretitulo: 'Aula 1', titulo: 'Cupons' };

function projeto(falas: FalaDeTeste[]): Projeto {
  const ana = Personagem.de(IdPersonagem.de('ana'), { nome: 'Ana', rig: 'teste', parametros: { pele: '#aa8866' }, voz: { id: 'vivian' }, expressaoPadrao: 'feliz' });
  const teo = Personagem.de(IdPersonagem.de('teo'), { nome: 'Téo', rig: 'teste', parametros: {}, voz: { id: 'ryan' }, expressaoPadrao: 'neutra' });
  const narrador = Personagem.de(IdPersonagem.NARRADOR, { nome: 'Narrador', parametros: {}, voz: { id: 'eric' }, expressaoPadrao: 'neutra' });
  const lista = falas.map(({ quem = 'ana', ...dados }) => Fala.de(IdPersonagem.de(quem), { ...dados, capitulo: Capitulo.de(1) }));
  return Projeto.de(
    { titulo: 'Cupons', formato: 'aula', idioma: Idioma.PORTUGUES, proporcao: Proporcao.VERTICAL, estiloDeLegenda: 'palavras', voz: { provedor: 'qwen' } },
    { elenco: Elenco.de([ana, teo, narrador]), roteiro: Roteiro.de(['Abertura'], Falas.de(lista)), avisos: [] },
  );
}

function voz(idFala: string, quadros: number, { palavras, envelope }: { palavras?: PalavraJson[]; envelope?: number[] } = {}): VozGravada {
  return {
    arquivo: `voz/${idFala}.wav`, hash: 'h', duracaoSegundos: quadros / 30 + 0.01,
    envelope: envelope ?? Array(quadros).fill(0.5), visemas: 'A'.repeat(quadros), ...(palavras ? { palavras } : {}),
  };
}

function montar(vozes: VozGravada[]) {
  const armazem = new ArmazemEmMemoria();
  vozes.forEach((registro, indice) => armazem.registros.set(String(indice + 1), registro));
  return new MontarLinhaDoTempo({ armazem });
}

const comCena = (id: string, texto: string, extra: Partial<FalaDeTeste> = {}): FalaDeTeste => ({ id, texto, cena: titulo, ...extra });

test('fala sem cena herda a cena anterior', async () => {
  const cartao: Cena = { tipo: 'cartao', variante: 'resumo', titulo: 'Resumo', itens: ['a'] };
  const caso = montar([voz('1', 30), voz('2', 30), voz('3', 30)]);
  const props = await caso.executar(projeto([comCena('1', 'Oi.'), { id: '2', texto: 'Tudo bem?' }, { id: '3', texto: 'Fim.', cena: cartao }]));
  const [primeiro, segundo, terceiro] = props.trechos;
  assert.deepEqual(segundo!.cena, primeiro!.cena);
  assert.equal(segundo!.chaveDaCena, primeiro!.chaveDaCena);
  assert.deepEqual(terceiro!.cena, cartao);
  assert.notEqual(terceiro!.chaveDaCena, segundo!.chaveDaCena);
});

test('primeira fala sem cena é recusada', async () => {
  const caso = montar([voz('1', 30)]);
  await assert.rejects(caso.executar(projeto([{ id: '1', texto: 'Oi.' }])), /fala 1: a primeira fala precisa de cena/);
});

const CUPOM = 'Um cliente [usou um cupom] e [pagou mais].';
const PALAVRAS_DO_CUPOM: PalavraJson[] = [
  { texto: 'Um', inicio: 0, fim: 0.2 }, { texto: 'cliente', inicio: 0.2, fim: 0.6 }, { texto: '[usou', inicio: 0.6, fim: 0.9 },
  { texto: 'um', inicio: 0.9, fim: 1 }, { texto: 'cupom]', inicio: 1, fim: 1.4 }, { texto: 'e', inicio: 1.4, fim: 1.5 },
  { texto: '[pagou', inicio: 1.5, fim: 1.9 }, { texto: 'mais].', inicio: 2, fim: 2.3 },
];

test('marca do segundo [trecho] cai no quadro da palavra que o abre', async () => {
  const caso = montar([voz('1', 75, { palavras: PALAVRAS_DO_CUPOM })]);
  const props = await caso.executar(projeto([comCena('1', CUPOM, { marcas: [{ expressao: 'surpresa' }, { expressao: 'brava' }] })]));
  const [trecho] = props.trechos;
  assert.deepEqual(trecho!.marcas.map((marca) => marca.quadro), [18, 45]);
  assert.deepEqual(trecho!.marcas[1]!.mudancas, { expressao: 'brava' });
});

test('as palavras do trecho vêm em quadros relativos e sem os colchetes', async () => {
  const caso = montar([voz('1', 75, { palavras: PALAVRAS_DO_CUPOM })]);
  const props = await caso.executar(projeto([comCena('1', CUPOM, { marcas: [{}, {}] })]));
  const palavras = props.trechos[0]!.palavras;
  assert.deepEqual(palavras.map((palavra) => palavra.texto), ['Um', 'cliente', 'usou', 'um', 'cupom', 'e', 'pagou', 'mais.']);
  assert.deepEqual(palavras[6], { texto: 'pagou', inicio: 45, fim: 57 });
});

test('sem palavras gravadas, a marca é interpolada pelos quadros com voz', async () => {
  const envelope = [...Array(10).fill(0), ...Array(30).fill(0.5)];
  const caso = montar([voz('1', 40, { envelope })]);
  const props = await caso.executar(projeto([comCena('1', 'aaaa [bbbb]', { marcas: [{}] })]));
  // "aaaa bbbb": a marca está no caractere 5 de 9 → quadro com voz nº floor(5/9 × 30) = 16 → quadro 10 + 16
  assert.equal(props.trechos[0]!.marcas[0]!.quadro, 26);
  assert.deepEqual(props.trechos[0]!.palavras.map((palavra) => palavra.texto), ['aaaa', 'bbbb']);
});

test('número de marcas diferente do de [trechos] é recusado', async () => {
  const caso = montar([voz('1', 75, { palavras: PALAVRAS_DO_CUPOM })]);
  await assert.rejects(caso.executar(projeto([comCena('1', CUPOM, { marcas: [{}] })])), /fala 1: 2 \[trechos\] no texto, mas 1 marca/);
});

test('as mudanças de cena das marcas passam para a fala seguinte', async () => {
  const cartao: Cena = { tipo: 'cartao', variante: 'resumo', titulo: 'Resumo', itens: ['a', 'b'], mostrados: 1 };
  const caso = montar([voz('1', 30), voz('2', 30)]);
  const props = await caso.executar(projeto([
    { id: '1', texto: 'Primeiro [segundo].', cena: cartao, marcas: [{ mostrados: 2, pose: 'apontar' }] }, { id: '2', texto: 'Viu?' },
  ]));
  assert.deepEqual(props.trechos[0]!.marcas[0]!.mudancas, { mostrados: 2, pose: 'apontar' });
  assert.deepEqual(props.trechos[1]!.cena, { ...cartao, mostrados: 2 });
  assert.equal(props.trechos[1]!.chaveDaCena, props.trechos[0]!.chaveDaCena);
});

test('total de quadros = soma das durações', async () => {
  const caso = montar([voz('1', 30), voz('2', 45)]);
  const props = await caso.executar(projeto([comCena('1', 'Oi.'), { id: '2', texto: 'Tudo bem?' }]));
  const [primeiro, segundo] = props.trechos;
  assert.equal(primeiro!.duracaoDaFala, 30);
  assert.equal(primeiro!.duracaoTotal, 30 + RESPIRO);
  assert.equal(segundo!.inicio, 30 + RESPIRO);
  assert.equal(props.totalDeQuadros, primeiro!.duracaoTotal + segundo!.duracaoTotal);
});

test('a duração da fala é o tamanho do envelope, não a duração arredondada para cima', async () => {
  const caso = montar([voz('1', 30)]);
  const props = await caso.executar(projeto([comCena('1', 'Oi.')]));
  assert.equal(props.trechos[0]!.duracaoDaFala, 30);
});

test('código novo na tela ganha pausa de leitura; a fala que herda o código não', async () => {
  const linhas = [...Array(10).keys()].map((numero) => `linha ${numero}`);
  const codigo: Cena = { tipo: 'codigo', titulo: 'cupom.ts', linhas: [...linhas, '', '  '], adicionadas: [2] };
  const caso = montar([voz('1', 30), voz('2', 30)]);
  const props = await caso.executar(projeto([{ id: '1', texto: 'Veja.', cena: codigo }, { id: '2', texto: 'Viu?' }]));
  // 10 linhas com texto × 0,35 s = 3,5 → 4 s (mínimo 4, máximo 9) + 1 s por haver linhas adicionadas
  assert.deepEqual(props.trechos[0]!.pausaDepois, { segundos: 5, rotulo: 'Leia o código' });
  assert.equal(props.trechos[0]!.duracaoTotal, 30 + 150 + RESPIRO);
  assert.equal(props.trechos[1]!.pausaDepois, undefined);
  assert.equal(props.trechos[1]!.duracaoTotal, 30 + RESPIRO);
});

test('pausaDepois explícita soma quadros, mantém o rótulo e toca o tique a cada segundo', async () => {
  const caso = montar([voz('1', 30)]);
  const props = await caso.executar(projeto([comCena('1', 'Pense.', { pausaDepois: { segundos: 2, rotulo: 'Pense' } })]));
  assert.deepEqual(props.trechos[0]!.pausaDepois, { segundos: 2, rotulo: 'Pense' });
  assert.equal(props.trechos[0]!.duracaoTotal, 30 + 60 + RESPIRO);
  assert.deepEqual(props.efeitosSonoros, [{ quadro: 30, som: 'tique' }, { quadro: 60, som: 'tique' }]);
});

test('efeitos sonoros da fala, das marcas e da troca de cena vão em quadros absolutos', async () => {
  const caso = montar([voz('1', 30), voz('2', 75, { palavras: PALAVRAS_DO_CUPOM })]);
  const cartao: Cena = { tipo: 'cartao', variante: 'resumo', titulo: 'Resumo', itens: ['a'] };
  const props = await caso.executar(projeto([
    comCena('1', 'Oi.', { efeitoSonoro: 'pop' }),
    { id: '2', texto: CUPOM, cena: cartao, marcas: [{ efeitoSonoro: 'ding' }, {}] },
  ]));
  const inicio = 30 + RESPIRO;
  assert.deepEqual(props.efeitosSonoros, [
    { quadro: 0, som: 'pop' }, { quadro: inicio, som: 'whoosh' }, { quadro: inicio + 18, som: 'ding' },
  ]);
});

test('narrador fala sem estado de corpo', async () => {
  const caso = montar([voz('1', 30)]);
  const props = await caso.executar(projeto([comCena('1', 'Era uma vez.', { quem: 'narrador', reacao: { expressao: 'surpresa' } })]));
  const estados = props.trechos[0]!.estados;
  assert.ok(!('narrador' in estados));
  assert.deepEqual(estados.ana, { pose: 'neutra', expressao: 'surpresa', olhar: 'outro' });
  assert.deepEqual(estados.teo, { pose: 'neutra', expressao: 'surpresa', olhar: 'outro' });
});

test('quem fala usa pose, expressão e olhar da fala; quem escuta usa a reação ou o padrão', async () => {
  const caso = montar([voz('1', 30), voz('2', 30)]);
  const props = await caso.executar(projeto([
    comCena('1', 'Oi.', { pose: 'acenar', reacao: { pose: 'pensar' } }), { id: '2', texto: 'Olá.', quem: 'teo', olhar: 'camera' },
  ]));
  assert.deepEqual(props.trechos[0]!.estados, {
    ana: { pose: 'acenar', expressao: 'feliz', olhar: 'conteudo' }, teo: { pose: 'pensar', expressao: 'neutra', olhar: 'outro' },
  });
  assert.deepEqual(props.trechos[1]!.estados.teo, { pose: 'neutra', expressao: 'neutra', olhar: 'camera' });
});

test('falta de áudio lista as falas pendentes', async () => {
  const caso = montar([voz('1', 30)]);
  const semAudio = projeto([comCena('1', 'Oi.'), { id: '2', texto: 'Dois.' }, { id: '3', texto: 'Três.' }]);
  await assert.rejects(caso.executar(semAudio), /falas sem áudio: 2, 3/);
});

test('as props são JSON puro: ida e volta por JSON dá o mesmo objeto', async () => {
  const caso = montar([voz('1', 75, { palavras: PALAVRAS_DO_CUPOM }), voz('2', 30)]);
  const props = await caso.executar(projeto([
    comCena('1', CUPOM, { marcas: [{ mostrados: 1 }, { efeitoSonoro: 'pop' }], pausaDepois: { segundos: 1, rotulo: 'Pense' } }),
    { id: '2', texto: 'Fim.', quem: 'narrador' },
  ]));
  assert.deepEqual(JSON.parse(JSON.stringify(props)), props);
});

test('a ficha do projeto e o elenco vão nas props', async () => {
  const caso = montar([voz('1', 30)]);
  const props = await caso.executar(projeto([comCena('1', 'Oi.')]));
  const { fps, largura, altura, idioma, formato, estiloDeLegenda, titulo: tituloDoVideo, capitulos, elenco } = props;
  assert.equal('marca' in props, false);
  assert.deepEqual({ fps, largura, altura, idioma, formato, estiloDeLegenda, titulo: tituloDoVideo, capitulos, elenco }, {
    fps: 30, largura: 1080, altura: 1920, idioma: 'pt-BR', formato: 'aula', estiloDeLegenda: 'palavras', titulo: 'Cupons', capitulos: ['Abertura'],
    elenco: [
      { id: 'ana', nome: 'Ana', rig: 'teste', parametros: { pele: '#aa8866' }, expressaoPadrao: 'feliz' },
      { id: 'teo', nome: 'Téo', rig: 'teste', parametros: {}, expressaoPadrao: 'neutra' },
      { id: 'narrador', nome: 'Narrador', parametros: {}, expressaoPadrao: 'neutra' },
    ],
  });
  assert.equal(props.trechos[0]!.audio, 'voz/1.wav');
  assert.equal(props.trechos[0]!.visemas, 'A'.repeat(30));
});
