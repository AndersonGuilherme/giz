import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErroDeProjeto } from '../../../src/aplicacao/portas/ErroDeProjeto.ts';
import { RepositorioDeProjetoEmDisco } from '../../../src/infraestrutura/disco/RepositorioDeProjetoEmDisco.ts';
import { IdPersonagem } from '../../../src/dominio/valores/IdPersonagem.ts';
import { CatalogoDeRigsFalso } from '../../dublês/CatalogoDeRigsFalso.ts';

type Json = Record<string, unknown>;

const FIXTURES = fileURLToPath(new URL('../../fixtures/', import.meta.url));
const fixture = (nome: string) => join(FIXTURES, nome);
const repositorio = () => new RepositorioDeProjetoEmDisco({ catalogo: new CatalogoDeRigsFalso() });
const pastasTemporarias: string[] = [];

after(() => Promise.all(pastasTemporarias.map((pasta) => rm(pasta, { recursive: true, force: true }))));

async function copiaAlterada(arquivo: string, alterar: (json: Json) => Json): Promise<string> {
  const pasta = await mkdtemp(join(tmpdir(), 'giz-projeto-'));
  pastasTemporarias.push(pasta);
  await cp(fixture('projeto-minimo'), pasta, { recursive: true });
  const caminho = join(pasta, arquivo);
  const json = JSON.parse(await readFile(caminho, 'utf8')) as Json;
  await writeFile(caminho, JSON.stringify(alterar(json)));
  return pasta;
}

const carregarCom = async (arquivo: string, alterar: (json: Json) => Json) =>
  repositorio().carregar(await copiaAlterada(arquivo, alterar));
const carregarComProjeto = (parcial: Json) => carregarCom('projeto.json', (json) => ({ ...json, ...parcial }));
const carregarComRoteiro = (parcial: Json) => carregarCom('roteiro.json', (json) => ({ ...json, ...parcial }));
const carregarComPersonagem = (parcial: Json) => carregarCom('elenco/ana.json', (json) => ({ ...json, ...parcial }));
const carregarComCena = (cena: Json) =>
  carregarCom('roteiro.json', (json) => {
    const [primeira, ...resto] = json.falas as Json[];
    return { ...json, falas: [{ ...primeira, cena }, ...resto] };
  });

async function capturar(promessa: Promise<unknown>): Promise<ErroDeProjeto> {
  try {
    await promessa;
  } catch (erro) {
    assert.ok(erro instanceof ErroDeProjeto, `esperava ErroDeProjeto, veio ${String(erro)}`);
    return erro;
  }
  assert.fail('esperava ErroDeProjeto');
}

test('carrega o projeto mínimo', async () => {
  const p = await repositorio().carregar(fixture('projeto-minimo'));
  assert.equal(p.idioma().codigo(), 'pt-BR');
  assert.equal(p.roteiro().falas().quantidade(), 2);
  assert.ok(p.elenco().contem(IdPersonagem.de('ana')));
  assert.equal(p.titulo(), 'Projeto mínimo');
  assert.equal(p.formato(), 'historia');
  assert.equal(p.proporcao().texto(), '9:16');
  assert.deepEqual(p.avisos(), []);
});
test('fala de personagem fora do elenco vira erro legível', async () => {
  await assert.rejects(carregarComRoteiro({ falas: [{ id: '1', capitulo: 1, quem: 'bia', texto: 'oi' }] }),
    { name: 'ErroDeProjeto', message: /roteiro\.json › falas\[0\]\.quem: "bia" não está no elenco \(ana\)/ });
});
test('cor inválida no personagem aponta arquivo e campo', async () => {
  await assert.rejects(carregarComPersonagem({ parametros: { pele: 'roxo' } }), /elenco\/ana\.json › parametros\.pele: cor "roxo"/);
});
test('vários erros saem juntos, não só o primeiro', async () => {
  const erro = await capturar(carregarComRoteiro({ falas: [{ id: '1' }, { id: '2' }] }));
  assert.ok(erro.problemas.length >= 4);
});
test('imagem de cenário ausente é aviso, não falha de carga', async () => {
  const p = await carregarComCena({ tipo: 'cenario', fundo: { imagem: 'cenarios/nao-existe.png' }, personagens: [] });
  assert.match(p.avisos().join('\n'), /cenarios\/nao-existe\.png não encontrada.*fala 1/);
});

test('campo obrigatório ausente diz o caminho', async () => {
  const erro = await capturar(carregarComRoteiro({ falas: [{ id: '1', capitulo: 1, quem: 'ana' }] }));
  assert.match(erro.message, /roteiro\.json › falas\[0\]\.texto: obrigatório/);
});
test('capítulo inexistente é erro', async () => {
  await assert.rejects(carregarComRoteiro({ falas: [{ id: '1', capitulo: 3, quem: 'ana', texto: 'oi' }] }),
    /falas\[0\]\.capitulo: capítulo 3 não existe \(há 1\)/);
});
test('ids de fala repetidos são erro', async () => {
  const falas = [{ id: '1', capitulo: 1, quem: 'ana', texto: 'oi' }, { id: '1', capitulo: 1, quem: 'ana', texto: 'de novo' }];
  await assert.rejects(carregarComRoteiro({ falas }), /falas\[1\]\.id: id "1" repetido/);
});
test('campo desconhecido é erro', async () => {
  await assert.rejects(carregarComProjeto({ cor: 'azul' }), /projeto\.json › cor: campo desconhecido/);
});
test('idioma inválido usa a mensagem do domínio', async () => {
  await assert.rejects(carregarComProjeto({ idioma: 'es' }), /projeto\.json › idioma: idioma "es" não suportado/);
});
test('arquivo de personagem ausente é erro', async () => {
  await assert.rejects(carregarComProjeto({ elenco: ['ana', 'bia'] }), /elenco\/bia\.json: arquivo não encontrado/);
});
test('id do personagem diferente do arquivo é erro', async () => {
  await assert.rejects(carregarComPersonagem({ id: 'bia' }), /elenco\/ana\.json › id: "bia" difere do nome do arquivo \(ana\)/);
});
test('rig desconhecido lista os rigs válidos', async () => {
  await assert.rejects(carregarComPersonagem({ rig: 'robo' }), /elenco\/ana\.json › rig: rig "robo" desconhecido \(use teste\)/);
});
test('parâmetro desconhecido do rig é erro', async () => {
  await assert.rejects(carregarComPersonagem({ parametros: { asas: true } }),
    /parametros\.asas: parâmetro desconhecido no rig "teste" \(use pele, altura, cabelo, oculos\)/);
});
test('número fora do intervalo e opção inválida saem juntos', async () => {
  const erro = await capturar(carregarComPersonagem({ parametros: { altura: 3, cabelo: 'roxo', oculos: 'sim' } }));
  assert.match(erro.message, /parametros\.altura: número 3 fora de 0\.5 a 1\.5/);
  assert.match(erro.message, /parametros\.cabelo: opção "roxo" inválida \(use curto, longo\)/);
  assert.match(erro.message, /parametros\.oculos: esperava verdadeiro ou falso, veio "sim"/);
});
test('parâmetros ausentes recebem o padrão do rig', async () => {
  const p = await carregarComPersonagem({ parametros: { altura: 1.2 } });
  const ana = p.elenco().personagem(IdPersonagem.de('ana'));
  assert.deepEqual(ana.ficha().parametros, { pele: '#f0c8a0', altura: 1.2, cabelo: 'curto', oculos: false });
});
test('tipo de cena desconhecido lista os tipos', async () => {
  await assert.rejects(carregarComCena({ tipo: 'casa' }), /falas\[0\]\.cena\.tipo: tipo inválido \(use cenario, titulo,/);
});
test('personagem em cena fora do elenco é erro', async () => {
  const cena = { tipo: 'cenario', fundo: {}, personagens: [{ quem: 'bia', posicao: { x: 0.5, y: 0.8 } }] };
  await assert.rejects(carregarComCena(cena), /falas\[0\]\.cena\.personagens\[0\]\.quem: "bia" não está no elenco \(ana\)/);
});
test('cena de código embutido e cenário completo carregam', async () => {
  const codigo = { tipo: 'codigo', titulo: 'soma.ts', linhas: ['const a = 1;', 'const b = 2;'], adicionadas: [1], destaque: ['b'] };
  const p = await carregarComCena(codigo);
  assert.deepEqual(p.roteiro().falas().cadaUma()[0].dados().cena, codigo);
  const cenario = {
    tipo: 'cenario', fundo: { vetorial: 'sala', cores: { parede: '#ffeedd' } },
    personagens: [{ quem: 'ana', posicao: 'esquerda', escala: 1.1, direcao: 'direita' }],
    camera: { tipo: 'aproximar', de: { x: 0, y: 0, zoom: 1 }, para: { x: 0.2, y: 0.1, zoom: 1.4 }, suavidade: 'suave' },
    efeitos: [{ tipo: 'vinheta', intensidade: 0.4 }, { tipo: 'brilho', cor: '#ffffff', posicao: { x: 0.5, y: 0.2 } }],
    hud: { campos: [{ rotulo: 'Vida', valor: '3' }], barra: { rotulo: 'Energia', valor: 80 } },
    destaque: { texto: 'UAU', cor: '#ff0000', entrada: 'pop' },
  };
  await carregarComCena(cenario);
});
test('cor inválida dentro da cena aponta o caminho', async () => {
  const cena = { tipo: 'cenario', fundo: { cores: { parede: 'bege' } }, personagens: [] };
  await assert.rejects(carregarComCena(cena), /falas\[0\]\.cena\.fundo\.cores\.parede: cor "bege" inválida/);
});
test('barra do HUD acima de 100 é erro', async () => {
  const cena = { tipo: 'cenario', fundo: {}, personagens: [], hud: { campos: [], barra: { rotulo: 'x', valor: 120 } } };
  await assert.rejects(carregarComCena(cena), /cena\.hud\.barra\.valor: deve ser no máximo 100/);
});
