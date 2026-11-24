import type { Expressao, Pose } from '../elenco/PoseEExpressao.ts';
import type { Visema } from '../fala/Visemas.ts';
import { Marcas } from './Marcas.ts';
import type { EstadoJson, TrechoJson } from './PropsDoVideo.ts';

/** Um personagem num quadro de um trecho; `relativo` é o quadro desde o início do trecho. */
export type NoTrecho = Readonly<{ trecho: TrechoJson; id: string; relativo: number }>;

export type Boca = Readonly<{ falando: boolean; visema: Visema; abertura: number }>;

const BOCA_FECHADA: Boca = { falando: false, visema: 'X', abertura: 0 };
const DEPOIS_DE_TUDO = Number.POSITIVE_INFINITY;

function fala(local: NoTrecho): boolean {
  return local.trecho.quem === local.id;
}

function mudancaAte<Valor>(local: NoTrecho, campo: 'pose' | 'expressao'): Valor | undefined {
  const marcas = Marcas.deJson(local.trecho.marcas);
  const marca = marcas.ultimaAte(campo, local.relativo);
  return marca?.mudancas[campo] as Valor | undefined;
}

/** Pose, expressão e olhar no quadro: as marcas mudam a pose e a expressão de quem fala a partir do seu quadro. */
export function estadoNoTrecho(local: NoTrecho): EstadoJson | undefined {
  const base = local.trecho.estados[local.id];
  if (!base || !fala(local)) return base;
  const pose = mudancaAte<Pose>(local, 'pose') ?? base.pose;
  const expressao = mudancaAte<Expressao>(local, 'expressao') ?? base.expressao;
  return { ...base, pose, expressao };
}

function visemaNo(trecho: TrechoJson, relativo: number): Visema {
  const visemas = trecho.visemas ?? '';
  return (visemas[relativo] ?? 'X') as Visema;
}

function aberturaNo(trecho: TrechoJson, relativo: number): number {
  const envelope = trecho.envelope ?? [];
  return envelope[relativo] ?? 0;
}

/** A boca só mexe em quem fala, durante a fala (não na pausa nem no respiro). */
export function bocaNoTrecho(local: NoTrecho): Boca {
  const { trecho, relativo } = local;
  if (!fala(local) || relativo >= trecho.duracaoDaFala) return BOCA_FECHADA;
  return { falando: true, visema: visemaNo(trecho, relativo), abertura: aberturaNo(trecho, relativo) };
}

// Onde (quadro absoluto) uma marca deste trecho deu a pose atual; `undefined` se a pose veio do começo do trecho.
function inicioPelaMarca(local: NoTrecho): number | undefined {
  if (!fala(local)) return undefined;
  const marcas = Marcas.deJson(local.trecho.marcas);
  const marca = marcas.ultimaAte('pose', local.relativo);
  return marca && local.trecho.inicio + marca.quadro;
}

// O mesmo personagem no fim do trecho anterior, se ele terminou na mesma pose.
function naMesmaPoseAntes(anterior: TrechoJson | undefined, local: NoTrecho): NoTrecho | undefined {
  if (!anterior) return undefined;
  const noAnterior = { trecho: anterior, id: local.id, relativo: DEPOIS_DE_TUDO };
  const mesmaPose = estadoNoTrecho(noAnterior)?.pose === estadoNoTrecho(local)?.pose;
  return mesmaPose ? noAnterior : undefined;
}

/**
 * O quadro (absoluto) em que a pose atual começou: na marca que a deu ou no começo do trecho. Se o trecho
 * anterior terminou na mesma pose, ela continua e o gesto não recomeça.
 */
export function inicioDaPose(trechos: readonly TrechoJson[], indice: number, local: NoTrecho): number {
  const pelaMarca = inicioPelaMarca(local);
  if (pelaMarca !== undefined) return pelaMarca;
  const noAnterior = naMesmaPoseAntes(trechos[indice - 1], local);
  if (!noAnterior) return local.trecho.inicio;
  return inicioDaPose(trechos, indice - 1, noAnterior);
}
