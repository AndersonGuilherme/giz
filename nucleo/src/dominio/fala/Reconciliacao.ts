// Junta o que o reconhecimento de fala ouviu (com tempos) às palavras do roteiro (o texto que vale).
import { Segundos } from '../valores/Tempo.ts';
import { alinharSequencias, type Faixa, type Par } from './AlinhamentoDeSequencia.ts';
import type { PalavraJson } from './PalavraJson.ts';
import type { Palavras } from './Palavras.ts';
import { normalizar } from './Semelhanca.ts';

type Trecho = Readonly<{ inicio: number; fim: number }>;

const MINIMO_EMPARELHADO = 0.6;
const ZERO: Trecho = { inicio: 0, fim: 0 };

// Peso de cada palavra no tempo: o número de letras (pelo menos 1).
const pesos = (textos: readonly string[]) => textos.map((texto) => Math.max(1, normalizar(texto).length));

// Divide o trecho entre as palavras, proporcional ao peso; `inicio*(1-f) + fim*f` acerta as pontas exatamente.
function repartir(trecho: Trecho, pesosDasPalavras: readonly number[]): Trecho[] {
  const total = pesosDasPalavras.reduce((soma, peso) => soma + peso, 0);
  const acumulados = pesosDasPalavras.map((_peso, indice) => pesosDasPalavras.slice(0, indice).reduce((soma, peso) => soma + peso, 0));
  const ponto = (acumulado: number) => trecho.inicio * (1 - acumulado / total) + trecho.fim * (acumulado / total);
  return acumulados.map((acumulado, indice) => ({ inicio: ponto(acumulado), fim: ponto(acumulado + (pesosDasPalavras[indice] ?? 0)) }));
}

function colocar(tempos: (Trecho | undefined)[], faixa: Faixa, trechos: readonly Trecho[]): void {
  trechos.forEach((trecho, deslocamento) => (tempos[faixa.inicio + deslocamento] = trecho));
}

function temposDosPares(pares: readonly Par[], textos: readonly string[], ouvidas: readonly PalavraJson[]): (Trecho | undefined)[] {
  const tempos: (Trecho | undefined)[] = textos.map(() => undefined);
  pares.forEach(({ roteiro, ouvidas: faixa }) => {
    const trecho = { inicio: ouvidas[faixa.inicio]?.inicio ?? 0, fim: ouvidas[faixa.fim - 1]?.fim ?? 0 };
    colocar(tempos, roteiro, repartir(trecho, pesos(textos.slice(roteiro.inicio, roteiro.fim))));
  });
  return tempos;
}

// Sequências de palavras do roteiro que ficaram sem par.
function lacunas(tempos: readonly (Trecho | undefined)[]): Faixa[] {
  return tempos.reduce<Faixa[]>((faixas, tempo, indice) => {
    if (tempo) return faixas;
    const ultima = faixas.at(-1);
    if (ultima?.fim === indice) return [...faixas.slice(0, -1), { inicio: ultima.inicio, fim: indice + 1 }];
    return [...faixas, { inicio: indice, fim: indice + 1 }];
  }, []);
}

// As palavras sem par ganham o tempo entre a vizinha anterior e a seguinte (ou o fim do que foi ouvido).
function preencherLacunas(tempos: (Trecho | undefined)[], textos: readonly string[], fimOuvido: number): Trecho[] {
  lacunas(tempos).forEach((faixa) => {
    const inicio = tempos[faixa.inicio - 1]?.fim ?? 0;
    const fim = Math.max(inicio, tempos[faixa.fim]?.inicio ?? fimOuvido);
    colocar(tempos, faixa, repartir({ inicio, fim }, pesos(textos.slice(faixa.inicio, faixa.fim))));
  });
  return tempos.map((tempo) => tempo ?? ZERO);
}

// Nenhuma palavra começa antes do fim da anterior nem termina antes de começar.
function emOrdem(tempos: readonly Trecho[]): Trecho[] {
  return tempos.reduce<Trecho[]>((ordenados, { inicio, fim }) => {
    const comeco = Math.max(inicio, ordenados.at(-1)?.fim ?? 0);
    return [...ordenados, { inicio: comeco, fim: Math.max(fim, comeco) }];
  }, []);
}

const emparelhadas = (pares: readonly Par[]) => pares.reduce((soma, { roteiro }) => soma + roteiro.fim - roteiro.inicio, 0);

/**
 * As palavras do roteiro com os tempos do que foi ouvido, em ordem crescente de tempo.
 * `null` quando menos de 60% das palavras do roteiro acharam par: aí o alinhamento não merece confiança.
 */
export function reconciliar(roteiro: Palavras, ouvidas: readonly PalavraJson[]): Palavras | null {
  const textos = roteiro.textos();
  const audiveis = ouvidas.filter((ouvida) => normalizar(ouvida.texto) !== '');
  const pares = alinharSequencias(textos.map(normalizar), audiveis.map((ouvida) => normalizar(ouvida.texto)));
  if (textos.length === 0 || emparelhadas(pares) < MINIMO_EMPARELHADO * textos.length) return null;
  const fimOuvido = Math.max(0, ...audiveis.map((ouvida) => ouvida.fim));
  const tempos = emOrdem(preencherLacunas(temposDosPares(pares, textos, audiveis), textos, fimOuvido));
  return roteiro.comTempos(tempos.map(({ inicio }) => Segundos.de(inicio)), tempos.map(({ fim }) => Segundos.de(fim)));
}
