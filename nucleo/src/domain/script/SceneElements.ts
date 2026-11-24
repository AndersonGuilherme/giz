/** Dados (JSON) dos elementos de um cenário; o comportamento vem nos Tasks 7 e 12. */
export type Ponto = Readonly<{ x: number; y: number }>;

export type Enquadramento = Readonly<{ x: number; y: number; zoom: number }>;

export const TIPOS_DE_MOVIMENTO = ['parada', 'aproximar', 'afastar', 'deslizar', 'seguir', 'tremer'] as const;
export const SUAVIDADES = ['linear', 'suave'] as const;

export type MovimentoDeCameraJson = Readonly<{
  tipo: (typeof TIPOS_DE_MOVIMENTO)[number];
  de?: Enquadramento;
  para?: Enquadramento;
  alvo?: string;
  intensidade?: number;
  suavidade?: (typeof SUAVIDADES)[number];
}>;

export const TIPOS_DE_EFEITO = ['vinheta', 'brilho', 'particulas', 'fogo', 'chuva', 'neve', 'tonalidade'] as const;

export type Efeito = Readonly<{
  tipo: (typeof TIPOS_DE_EFEITO)[number];
  intensidade?: number;
  cor?: string;
  posicao?: Ponto;
}>;

export type CampoDoHud = Readonly<{ rotulo: string; valor: string }>;

/** `barra.valor` vai de 0 a 100. */
export type Hud = Readonly<{
  campos: readonly CampoDoHud[];
  barra?: Readonly<{ rotulo: string; valor: number }>;
}>;

export const ENTRADAS_DE_TEXTO = ['pop', 'subir'] as const;

export type TextoGrande = Readonly<{ texto: string; cor?: string; entrada?: (typeof ENTRADAS_DE_TEXTO)[number] }>;
