import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GerarVozes } from '../../src/aplicacao/casos-de-uso/GerarVozes.ts';
import { Elenco } from '../../src/dominio/elenco/Elenco.ts';
import { Personagem } from '../../src/dominio/elenco/Personagem.ts';
import { Projeto } from '../../src/dominio/projeto/Projeto.ts';
import { Capitulo } from '../../src/dominio/roteiro/Capitulo.ts';
import { Fala } from '../../src/dominio/roteiro/Fala.ts';
import { Falas } from '../../src/dominio/roteiro/Falas.ts';
import { Roteiro } from '../../src/dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../src/dominio/valores/IdPersonagem.ts';
import { Idioma } from '../../src/dominio/valores/Idioma.ts';
import { Proporcao } from '../../src/dominio/valores/Proporcao.ts';
import { ArmazemEmMemoria } from '../dublês/ArmazemEmMemoria.ts';
import { FonetizadorFalso } from '../dublês/FonetizadorFalso.ts';
import { VozFalsa } from '../dublês/VozFalsa.ts';

type Opcoes = { textos?: string[]; estilo?: string; provedor?: 'qwen' | 'arquivo'; pronuncia?: string };

function projeto({ textos = ['Oi, eu sou a Ana.', 'Hoje vamos aprender juntos.'], estilo, provedor = 'qwen', pronuncia }: Opcoes = {}): Projeto {
  const ana = IdPersonagem.de('ana');
  const personagem = Personagem.de(ana, {
    nome: 'Ana', rig: 'teste', parametros: {}, voz: { id: 'vivian', estilo }, expressaoPadrao: 'neutra',
  });
  const falas = textos.map((texto, i) => Fala.de(ana, { id: String(i + 1), capitulo: Capitulo.de(1), texto, pronuncia: i === 0 ? pronuncia : undefined }));
  return Projeto.de(
    { titulo: 'T', formato: 'historia', idioma: Idioma.PORTUGUES, proporcao: Proporcao.VERTICAL, estiloDeLegenda: 'palavras', voz: { provedor } },
    { elenco: Elenco.de([personagem]), roteiro: Roteiro.de(['Abertura'], Falas.de(falas)), avisos: [] },
  );
}

function montar() {
  const voz = new VozFalsa();
  const armazem = new ArmazemEmMemoria();
  const caso = new GerarVozes({ voz, fonetizador: new FonetizadorFalso(), armazem });
  return { voz, armazem, caso };
}

test('fala com hash igual não é gerada de novo', async () => {
  const { voz, caso } = montar();
  await caso.executar(projeto());
  await caso.executar(projeto());
  assert.equal(voz.chamadas, 2);
});

test('mudar o texto de uma fala regrava só ela', async () => {
  const { voz, caso } = montar();
  await caso.executar(projeto());
  const relatorio = await caso.executar(projeto({ textos: ['Oi, eu sou a Ana.', 'Hoje vamos aprender muito.'] }));
  assert.equal(voz.chamadas, 3);
  assert.deepEqual(relatorio, { geradas: ['2'], puladas: ['1'] });
});

test('mudar estilo, pronúncia ou provedor regrava', async () => {
  const { voz, caso } = montar();
  await caso.executar(projeto());
  await caso.executar(projeto({ estilo: 'animada' }));
  await caso.executar(projeto({ estilo: 'animada', pronuncia: 'Oi, eu sou a Âna.' }));
  await caso.executar(projeto({ estilo: 'animada', pronuncia: 'Oi, eu sou a Âna.', provedor: 'arquivo' }));
  assert.equal(voz.chamadas, 2 + 2 + 1 + 2);
});

test('o pedido usa a pronúncia, a voz, o estilo e o idioma', async () => {
  const { voz, caso } = montar();
  await caso.executar(projeto({ estilo: 'calma', pronuncia: 'Ói, eu sou a Âna.' }));
  assert.deepEqual(voz.pedidos[0], { idFala: '1', texto: 'Ói, eu sou a Âna.', voz: 'vivian', estilo: 'calma', idioma: Idioma.PORTUGUES });
});

test('o registro tem um visema por quadro e X no silêncio', async () => {
  const { armazem, caso } = montar();
  await caso.executar(projeto());
  const registro = await armazem.ler('1');
  assert.equal(registro.visemas.length, Math.ceil(registro.duracaoSegundos * 30));
  assert.equal(registro.visemas[0], 'X');
  assert.equal(registro.visemas.at(-1), 'X');
  assert.match(registro.visemas, /^X+M[MA]+A+X+$/);
  assert.equal(registro.envelope.length, registro.visemas.length);
  assert.equal(registro.arquivo, 'voz/1.wav');
  assert.match(registro.hash, /^[0-9a-f]{40}$/);
});

test('o áudio gravado já vem aparado: sobra só 0,04 s de silêncio nas pontas', async () => {
  const { armazem, caso } = montar();
  await caso.executar(projeto());
  const registro = await armazem.ler('1');
  const esperado = 0.2 + 0.2 + 0.05 * 'Oi, eu sou a Ana.'.length + 2 * 0.04;
  assert.ok(Math.abs(registro.duracaoSegundos - esperado) < 0.002, `duração ${registro.duracaoSegundos}`);
});

test('o progresso é avisado a cada fala', async () => {
  const { caso } = montar();
  const avisos: unknown[] = [];
  await caso.executar(projeto(), (progresso) => avisos.push(progresso));
  await caso.executar(projeto(), (progresso) => avisos.push(progresso));
  assert.deepEqual(avisos, [
    { feitas: 1, total: 2, idFala: '1', gerada: true },
    { feitas: 2, total: 2, idFala: '2', gerada: true },
    { feitas: 1, total: 2, idFala: '1', gerada: false },
    { feitas: 2, total: 2, idFala: '2', gerada: false },
  ]);
});
