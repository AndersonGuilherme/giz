/** Cenas de aula: os campos das cenas do motor, em português. */
export const VARIANTES_DE_CARTAO = ['objetivo', 'resumo', 'desafio', 'proximo', 'chamado', 'regra'] as const;
export const CURVAS_DE_GRAFICO = ['saudavel', 'podre'] as const;
export const TONS_DE_TERMINAL = ['falha', 'ok', 'apagado'] as const;
export const TONS_DE_NO = ['nucleo', 'infraestrutura', 'interface', 'suave'] as const;

type Lado = Readonly<{ titulo: string; texto: string }>;

export type CenaDeTitulo = Readonly<{ tipo: 'titulo'; sobretitulo: string; titulo: string; subtitulo?: string }>;
export type CenaDeCartao = Readonly<{
  tipo: 'cartao';
  variante: (typeof VARIANTES_DE_CARTAO)[number];
  titulo: string;
  itens: readonly string[];
  mostrados?: number;
}>;
export type CenaDeCitacao = Readonly<{ tipo: 'citacao'; texto: string }>;
export type CenaDeGrafico = Readonly<{
  tipo: 'grafico';
  rotuloDoEixoX: string;
  rotuloDoEixoY: string;
  curvas: readonly (typeof CURVAS_DE_GRAFICO)[number][];
}>;
export type CenaDeSintomas = Readonly<{
  tipo: 'sintomas';
  itens: readonly Readonly<{ nome: string; descricao: string }>[];
  mostrados: number;
  foco?: number;
}>;
/** Código embutido; `adicionadas` são os índices (base 0) das linhas novas. */
export type CenaDeCodigo = Readonly<{
  tipo: 'codigo';
  titulo: string;
  linhas: readonly string[];
  adicionadas?: readonly number[];
  destaque?: readonly string[];
}>;
export type CenaDeTerminal = Readonly<{
  tipo: 'terminal';
  comando: string;
  linhas: readonly Readonly<{ texto: string; tom?: (typeof TONS_DE_TERMINAL)[number] }>[];
}>;
export type NoDoGrafo = Readonly<{ id: string; rotulo: string; x: number; y: number; tom?: (typeof TONS_DE_NO)[number] }>;
export type ArestaDoGrafo = Readonly<{ de: string; para: string; ruim?: boolean }>;
export type CenaDeGrafo = Readonly<{
  tipo: 'grafo';
  nos: readonly NoDoGrafo[];
  arestas: readonly ArestaDoGrafo[];
  focoNasRuins?: boolean;
}>;
export type CenaDeVersus = Readonly<{ tipo: 'versus'; errado: Lado; certo: Lado }>;
export type CenaDeTabela = Readonly<{
  tipo: 'tabela';
  titulo?: string;
  colunas: readonly string[];
  linhas: readonly Readonly<{ rotulo: string; celulas: readonly string[] }>[];
  linhasMostradas?: number;
  colunaDestacada?: number;
  linhaDestacada?: number;
}>;
export type CenaDeConversa = Readonly<{ tipo: 'conversa' }>;

export type CenaDeAula =
  | CenaDeTitulo
  | CenaDeCartao
  | CenaDeCitacao
  | CenaDeGrafico
  | CenaDeSintomas
  | CenaDeCodigo
  | CenaDeTerminal
  | CenaDeGrafo
  | CenaDeVersus
  | CenaDeTabela
  | CenaDeConversa;
