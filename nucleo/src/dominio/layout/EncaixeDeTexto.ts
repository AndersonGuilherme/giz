import type { Familia, Fonte } from './Fonte.ts';

export type Encaixe = Readonly<{ linhas: string[]; tamanho: number; cabe: boolean }>;

// Portado de motor/src/textFit.ts (sem DOM): largura média de um caractere em "em", um pouco folgada.
// O motor usa 0.58 para o texto; a família monoespaçada tem avanço fixo de 0.6 em.
const LARGURA_DO_CARACTERE_EM: Readonly<Record<Familia, number>> = { texto: 0.58, mono: 0.6 };
const MINIMO_DE_CARACTERES_POR_LINHA = 4;
const PASSO_DA_ESCALA = 0.04;
const PASSOS_ATE_O_MINIMO = 10; // 1 − 10 × 0.04 = 0.6: a letra encolhe até 60% do tamanho base

function caracteresPorLinha(fonte: Fonte, tamanho: number, larguraMaxima: number): number {
  const larguraDoCaractere = tamanho * LARGURA_DO_CARACTERE_EM[fonte.familia()];
  return Math.max(MINIMO_DE_CARACTERES_POR_LINHA, Math.floor(larguraMaxima / larguraDoCaractere));
}

// Palavra maior que a linha (URL, código) é quebrada em pedaços do tamanho da linha.
function pedacosDaPalavra(palavra: string, limite: number): string[] {
  const quantidade = Math.ceil(palavra.length / limite);
  return Array.from({ length: quantidade }, (_vazio, indice) => palavra.slice(indice * limite, (indice + 1) * limite));
}

function acrescentar(linhas: string[], pedaco: string, limite: number): string[] {
  const ultima = linhas.at(-1);
  if (ultima === undefined || ultima.length + 1 + pedaco.length > limite) return [...linhas, pedaco];
  return [...linhas.slice(0, -1), `${ultima} ${pedaco}`];
}

function quebrarParagrafo(paragrafo: string, limite: number): string[] {
  const palavras = paragrafo.split(/\s+/).filter(Boolean);
  const pedacos = palavras.flatMap((palavra) => pedacosDaPalavra(palavra, limite));
  if (pedacos.length === 0) return [''];
  return pedacos.reduce<string[]>((linhas, pedaco) => acrescentar(linhas, pedaco, limite), []);
}

function quebrar(texto: string, limite: number): string[] {
  const paragrafos = texto.trim().split('\n');
  return paragrafos.flatMap((paragrafo) => quebrarParagrafo(paragrafo, limite));
}

type Pedido = Readonly<{ texto: string; fonte: Fonte; larguraMaxima: number }>;

function encaixarNaEscala({ texto, fonte, larguraMaxima }: Pedido, passo: number): Encaixe {
  const tamanho = Math.round(fonte.tamanhoBase() * (1 - passo * PASSO_DA_ESCALA) * 100) / 100;
  const linhas = quebrar(texto, caracteresPorLinha(fonte, tamanho, larguraMaxima));
  return { linhas, tamanho, cabe: linhas.length <= fonte.maximoDeLinhas() };
}

/** Estima as linhas de um texto e diminui a letra até caber; abaixo de 60% do tamanho base, desiste (`cabe: false`). */
export class EncaixeDeTexto {
  static medir(texto: string, fonte: Fonte, larguraMaxima: number): Encaixe {
    const passos = Array.from({ length: PASSOS_ATE_O_MINIMO + 1 }, (_vazio, passo) => passo);
    const encaixes = passos.map((passo) => encaixarNaEscala({ texto, fonte, larguraMaxima }, passo));
    const primeiroQueCabe = encaixes.find((encaixe) => encaixe.cabe);
    return primeiroQueCabe ?? encaixes[PASSOS_ATE_O_MINIMO];
  }
}
