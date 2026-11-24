export const POSES = [
  'neutra', 'explicar', 'apontar', 'acenar', 'levantar', 'pensar', 'ombros', 'comemorar', 'mao-na-cabeca', 'maos-na-boca',
] as const;
export type Pose = (typeof POSES)[number];

export const EXPRESSOES = [
  'neutra', 'feliz', 'animada', 'surpresa', 'confusa', 'pensativa', 'cetica', 'preocupada', 'brava', 'assustada',
] as const;
export type Expressao = (typeof EXPRESSOES)[number];
