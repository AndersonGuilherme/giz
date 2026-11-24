// Alinhamento de sequência (Needleman-Wunsch) entre as palavras do roteiro e as ouvidas, já normalizadas.
// Além do par 1:1, aceita duas do roteiro numa ouvida ("pull request" → "pullrequest") e uma do roteiro
// em duas ouvidas ("deploy" → "the ploy"). A ordem das duas sequências é sempre mantida.
import { semelhanca } from './Semelhanca.ts';

/** Fatia [inicio, fim) de uma sequência. */
export type Faixa = Readonly<{ inicio: number; fim: number }>;
export type Par = Readonly<{ roteiro: Faixa; ouvidas: Faixa }>;
type Sequencias = Readonly<{ roteiro: readonly string[]; ouvidas: readonly string[] }>;
type Passo = Readonly<{ roteiro: number; ouvidas: number }>;
type Celula = Readonly<{ pontos: number; passo: Passo | undefined }>;

const PASSOS: readonly Passo[] = [
  { roteiro: 1, ouvidas: 1 },
  { roteiro: 2, ouvidas: 1 },
  { roteiro: 1, ouvidas: 2 },
  { roteiro: 1, ouvidas: 0 },
  { roteiro: 0, ouvidas: 1 },
];
const SEMELHANCA_MINIMA = 0.5;
// Juntar duas palavras do roteiro vale o dobro; sem esta exigência, "eu sou" engoliria um "sou" sozinho.
const SEMELHANCA_MINIMA_AO_JUNTAR = 0.8;
const ORIGEM: Celula = { pontos: 0, passo: undefined };
const IMPOSSIVEL: Celula = { pontos: -Infinity, passo: undefined };

// Pontos de um passo que termina em (linha, coluna): pulos valem 0; pares valem a semelhança por palavra do roteiro.
function pontosDoPasso(passo: Passo, fim: Readonly<{ linha: number; coluna: number }>, sequencias: Sequencias): number {
  if (passo.roteiro === 0 || passo.ouvidas === 0) return 0;
  const doRoteiro = sequencias.roteiro.slice(fim.linha - passo.roteiro, fim.linha).join('');
  const ouvido = sequencias.ouvidas.slice(fim.coluna - passo.ouvidas, fim.coluna).join('');
  const nota = semelhanca(doRoteiro, ouvido);
  const minima = passo.roteiro > 1 ? SEMELHANCA_MINIMA_AO_JUNTAR : SEMELHANCA_MINIMA;
  return nota < minima ? -Infinity : nota * passo.roteiro;
}

function melhorCelula(tabela: readonly Celula[][], fim: Readonly<{ linha: number; coluna: number }>, sequencias: Sequencias): Celula {
  if (fim.linha === 0 && fim.coluna === 0) return ORIGEM;
  const possiveis = PASSOS.filter((passo) => passo.roteiro <= fim.linha && passo.ouvidas <= fim.coluna);
  return possiveis.reduce((melhor, passo) => {
    const anterior = tabela[fim.linha - passo.roteiro]?.[fim.coluna - passo.ouvidas] ?? IMPOSSIVEL;
    const pontos = anterior.pontos + pontosDoPasso(passo, fim, sequencias);
    return pontos > melhor.pontos ? { pontos, passo } : melhor;
  }, IMPOSSIVEL);
}

function preencherLinha(tabela: Celula[][], linha: number, sequencias: Sequencias): void {
  const celulas: Celula[] = [];
  tabela.push(celulas);
  for (let coluna = 0; coluna <= sequencias.ouvidas.length; coluna++) celulas.push(melhorCelula(tabela, { linha, coluna }, sequencias));
}

function parDoPasso(passo: Passo, linha: number, coluna: number): Par[] {
  if (passo.roteiro === 0 || passo.ouvidas === 0) return [];
  return [{ roteiro: { inicio: linha - passo.roteiro, fim: linha }, ouvidas: { inicio: coluna - passo.ouvidas, fim: coluna } }];
}

// Volta do fim ao começo da tabela pelo melhor caminho, guardando só os pares.
function caminho(tabela: readonly Celula[][], sequencias: Sequencias): Par[] {
  const pares: Par[] = [];
  let linha = sequencias.roteiro.length;
  let coluna = sequencias.ouvidas.length;
  for (let passo = tabela[linha]?.[coluna]?.passo; passo; passo = tabela[linha]?.[coluna]?.passo) {
    pares.unshift(...parDoPasso(passo, linha, coluna));
    linha -= passo.roteiro;
    coluna -= passo.ouvidas;
  }
  return pares;
}

/** Os pares (em ordem) do melhor alinhamento entre as palavras do roteiro e as ouvidas. */
export function alinharSequencias(roteiro: readonly string[], ouvidas: readonly string[]): Par[] {
  const sequencias = { roteiro, ouvidas };
  const tabela: Celula[][] = [];
  for (let linha = 0; linha <= roteiro.length; linha++) preencherLinha(tabela, linha, sequencias);
  return caminho(tabela, sequencias);
}
