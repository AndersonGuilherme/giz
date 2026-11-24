import type { Fala } from '../roteiro/Fala.ts';
import { Fps } from '../valores/Tempo.ts';
import { Marcas } from './Marcas.ts';
import type { EfeitoSonoroJson, TrechoJson } from './PropsDoVideo.ts';
import type { CenaDaFala } from './SequenciaDeCenas.ts';

// Troca de cena (menos a primeira) faz "whoosh" no começo da fala.
function daTrocaDeCena(cena: CenaDaFala, inicio: number): EfeitoSonoroJson[] {
  return cena.aberta && cena.chave > 0 ? [{ quadro: inicio, som: 'whoosh' }] : [];
}

function daFala(fala: Fala, inicio: number): EfeitoSonoroJson[] {
  const som = fala.efeitoSonoro();
  return som ? [{ quadro: inicio, som }] : [];
}

// Tique a cada segundo, só na pausa explícita (a de desafio); a pausa de leitura é silenciosa.
function daPausa(fala: Fala, trecho: TrechoJson): EfeitoSonoroJson[] {
  const segundos = fala.pausaDepois() ? (trecho.pausaDepois?.segundos ?? 0) : 0;
  const fimDaFala = trecho.inicio + trecho.duracaoDaFala;
  const quantos = Math.ceil(segundos);
  return [...Array(quantos).keys()].map((segundo) => ({ quadro: fimDaFala + segundo * Fps.PADRAO.valor(), som: 'tique' }));
}

/** Os sons de um trecho, em quadros absolutos, na ordem do motor: troca de cena, fala, marcas e pausa. */
export function efeitosDoTrecho(fala: Fala, trecho: TrechoJson, cena: CenaDaFala): EfeitoSonoroJson[] {
  const marcas = Marcas.deJson(trecho.marcas);
  return [...daTrocaDeCena(cena, trecho.inicio), ...daFala(fala, trecho.inicio), ...marcas.efeitosSonoros(trecho.inicio), ...daPausa(fala, trecho)];
}
