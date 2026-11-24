import type { Proporcao } from '../valores/Proporcao.ts';
import { Caixa } from './Caixa.ts';

type Margens = Readonly<{ laterais: number; topo: number; base: number }>;

// Em 9:16 a interface do Reels e do Shorts cobre o topo e, principalmente, a base (legenda, botões).
const MARGENS_VERTICAL: Margens = { laterais: 0.08, topo: 0.13, base: 0.22 };
const MARGENS_HORIZONTAL: Margens = { laterais: 0.05, topo: 0.05, base: 0.05 };

/** Região em que todo texto precisa ficar; as margens são arredondadas para pixels inteiros. */
export class AreaSegura {
  static para(proporcao: Proporcao): Caixa {
    const margens = proporcao.vertical() ? MARGENS_VERTICAL : MARGENS_HORIZONTAL;
    const lateral = Math.round(proporcao.largura() * margens.laterais);
    const topo = Math.round(proporcao.altura() * margens.topo);
    const base = Math.round(proporcao.altura() * margens.base);
    return Caixa.de('área segura', { x: lateral, y: topo, largura: proporcao.largura() - 2 * lateral, altura: proporcao.altura() - topo - base });
  }
}
