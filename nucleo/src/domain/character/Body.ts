import type { Pose } from '../elenco/PoseEExpressao.ts';
import type { Fps, Quadro } from '../valores/Tempo.ts';

export type ContextoDoCorpo = Readonly<{
  pose: Pose;
  inicioDaPose: Quadro;
  falando: boolean;
  abertura: number; // volume da fala neste quadro, de 0 a 1
  fase: number; // desloca a respiração para dois personagens não respirarem juntos
  fps: Fps;
}>;

export type DeslocamentoDoCorpo = Readonly<{ y: number; rotacao: number; escala: number }>;

type Gesto = (desdeAPose: number, instante: number) => Readonly<{ y?: number; rotacao?: number }>;

// Gesto único: 0 → 1 → 0 em `duracao` segundos, depois zero.
function umaVez(desdeAPose: number, duracao: number): number {
  return desdeAPose < duracao ? Math.sin((desdeAPose / duracao) * Math.PI) : 0;
}

const GESTOS: Readonly<Record<Pose, Gesto>> = {
  neutra: () => ({}),
  comemorar: (desde) => ({ y: -umaVez(desde, 0.5) * 18 }),
  pensar: (_desde, instante) => ({ rotacao: 2 + Math.sin(instante * 0.9) * 0.6 }),
  levantar: (desde) => ({ rotacao: umaVez(desde, 0.6) * 2 }),
  acenar: (desde) => ({ rotacao: desde < 1.6 ? Math.sin(desde * 7) * 2 * (1 - desde / 1.6) : 0 }),
  explicar: (desde) => ({ rotacao: umaVez(desde, 0.6) * 1 }),
  apontar: (desde) => ({ rotacao: umaVez(desde, 0.5) * 1.5 }),
  ombros: (desde) => ({ y: -umaVez(desde, 0.4) * 3 }),
  'mao-na-cabeca': (desde) => ({ rotacao: umaVez(desde, 0.5) * 1.5 }),
  'maos-na-boca': (desde) => ({ y: -umaVez(desde, 0.3) * 2 }),
};

const RESPIRACAO_EM_PIXELS = 2;
const PUXAO_DO_VOLUME_EM_PIXELS = 5;

/** Movimento contido: respiração leve, o corpo acompanha o volume de leve e o gesto da pose acontece uma vez. */
export class Corpo {
  deslocamentoEm(quadro: Quadro, contexto: ContextoDoCorpo): DeslocamentoDoCorpo {
    const instante = quadro.valor() / contexto.fps.valor();
    const desdeAPose = quadro.menos(contexto.inicioDaPose).valor() / contexto.fps.valor();
    const gesto = GESTOS[contexto.pose](desdeAPose, instante);
    const fala = this.#efeitoDaFala(instante, contexto);
    return {
      y: Math.sin(instante * 1.5 + contexto.fase) * RESPIRACAO_EM_PIXELS + fala.y + (gesto.y ?? 0),
      rotacao: fala.rotacao + (gesto.rotacao ?? 0),
      escala: 1 + fala.escala,
    };
  }

  #efeitoDaFala(instante: number, contexto: ContextoDoCorpo): DeslocamentoDoCorpo {
    if (!contexto.falando) return { y: 0, rotacao: 0, escala: 0 };
    return {
      y: -contexto.abertura * PUXAO_DO_VOLUME_EM_PIXELS,
      rotacao: Math.sin(instante * 1.3 + contexto.fase) * 0.6 * contexto.abertura,
      escala: contexto.abertura * 0.006,
    };
  }
}
