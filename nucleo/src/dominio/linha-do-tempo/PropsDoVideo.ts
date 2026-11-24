import type { Expressao, Pose } from '../elenco/PoseEExpressao.ts';
import type { ValorDeParametro } from '../elenco/Personagem.ts';
import type { PalavraJson } from '../fala/PalavraJson.ts';
import type { EstiloDeLegenda, Formato } from '../projeto/Projeto.ts';
import type { Cena } from '../roteiro/Cena.ts';
import type { EfeitoSonoro, Olhar, PausaDepois } from '../roteiro/Fala.ts';

/** O que o Remotion recebe: só JSON (sem instâncias de classe nem Float32Array). Quadros a 30 fps. */

/** A cena do trecho com as mudanças das marcas das falas anteriores já aplicadas. */
export type CenaResolvida = Cena;

export type EstadoJson = { pose: Pose; expressao: Expressao; olhar: Olhar };

/** `quadro` é relativo ao início do trecho; `mudancas` traz os campos de cena e a expressão, a pose e o som. */
export type MarcaJson = { quadro: number; mudancas: Record<string, unknown> };

/** `quadro` é absoluto (desde o começo do vídeo). */
export type EfeitoSonoroJson = { quadro: number; som: EfeitoSonoro };

/** Uma palavra da legenda, com início e fim em quadros relativos ao início do trecho. */
export type PalavraEmQuadros = PalavraJson;

export type TrechoJson = {
  idFala: string;
  quem: string;
  inicio: number;
  duracaoDaFala: number;
  duracaoTotal: number;
  cena: CenaResolvida;
  chaveDaCena: number;
  palavras: PalavraEmQuadros[];
  marcas: MarcaJson[];
  /** Só personagens com corpo: o narrador não entra. */
  estados: Record<string, EstadoJson>;
  audio?: string;
  envelope?: number[];
  visemas?: string;
  pausaDepois?: PausaDepois;
};

export type PersonagemJson = {
  id: string;
  nome: string;
  rig?: string;
  parametros: Record<string, ValorDeParametro>;
  expressaoPadrao: Expressao;
};

export type PropsDoVideo = {
  fps: number;
  largura: number;
  altura: number;
  idioma: string;
  formato: Formato;
  estiloDeLegenda: EstiloDeLegenda;
  marca?: string;
  titulo: string;
  capitulos: string[];
  totalDeQuadros: number;
  trechos: TrechoJson[];
  elenco: PersonagemJson[];
  efeitosSonoros: EfeitoSonoroJson[];
};
