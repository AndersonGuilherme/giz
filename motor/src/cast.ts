// Elenco fixo do giz. O guia editorial (personagens/guia-editorial.md) explica o PORQUÊ de cada valor.
import type { Expression, Speaker } from './types';

export type CastMember = {
  name: string;
  role: string;
  voice: { id: string; language?: string }; // voz PADRÃO do Qwen3-TTS; cada instalação escolhe a sua no `npm run setup`
  defaultExpr: Expression; // quando o roteiro não diz
  idleExpr: Expression; // quando está ouvindo
  look: {
    hoodie: string;
    hoodieShade: string;
    emblem: 'star' | 'code'; // detalhe próprio no moletom
    brow: { width: number; arch: number }; // Lia: fina e arqueada · Téo: grossa e reta
    smile: number; // largura do sorriso em repouso
  };
};

export const CAST: Record<Speaker, CastMember> = {
  lia: {
    name: 'Lia',
    role: 'mentora de tecnologia',
    voice: { id: 'vivian' },
    defaultExpr: 'happy',
    idleExpr: 'neutral',
    look: { hoodie: '#8B3FF5', hoodieShade: '#6A22D6', emblem: 'star', brow: { width: 7, arch: 7 }, smile: 30 },
  },
  teo: {
    name: 'Téo',
    role: 'desenvolvedor curioso',
    voice: { id: 'dylan' },
    defaultExpr: 'neutral',
    idleExpr: 'neutral',
    look: { hoodie: '#4F35D9', hoodieShade: '#3A22B0', emblem: 'code', brow: { width: 10, arch: 2 }, smile: 24 },
  },
};

export const OTHER: Record<Speaker, Speaker> = { lia: 'teo', teo: 'lia' };
// Lia fica à esquerda, Téo à direita (mais perto do conteúdo).
export const SIDE: Record<Speaker, -1 | 1> = { lia: -1, teo: 1 };
