import type { CenaDeAula } from './CenasDeAula.ts';
import type { Efeito, Hud, MovimentoDeCameraJson, Ponto, TextoGrande } from './ElementosDeCena.ts';

export const POSICOES_NOMEADAS = ['esquerda', 'centro', 'direita'] as const;
export const DIRECOES = ['frente', 'esquerda', 'direita'] as const;

export type PersonagemEmCena = Readonly<{
  quem: string;
  posicao: (typeof POSICOES_NOMEADAS)[number] | Ponto;
  escala?: number;
  direcao?: (typeof DIRECOES)[number];
}>;

export type Fundo = Readonly<{ imagem?: string; vetorial?: string; cores?: Readonly<Record<string, string>> }>;

export type CenaDeCenario = Readonly<{
  tipo: 'cenario';
  fundo: Fundo;
  personagens: readonly PersonagemEmCena[];
  camera?: MovimentoDeCameraJson;
  efeitos?: readonly Efeito[];
  hud?: Hud;
  destaque?: TextoGrande;
}>;

export type Cena = CenaDeCenario | CenaDeAula;
