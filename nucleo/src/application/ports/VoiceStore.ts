import type { Audio } from '../../dominio/fala/Audio.ts';
import type { PalavraJson } from '../../dominio/fala/PalavraJson.ts';

/** O que fica gravado de cada fala, em `voz/<id>.json`; o áudio fica em `arquivo` (`voz/<id>.wav`). */
export type VozGravada = {
  arquivo: string;
  hash: string;
  duracaoSegundos: number;
  envelope: number[];
  visemas: string;
  palavras?: PalavraJson[];
};

/** Caminho do áudio da fala, relativo à pasta do projeto. */
export const arquivoDaVoz = (idFala: string): string => `voz/${idFala}.wav`;

export interface ArmazemDeVozes {
  /** O hash da voz já gravada da fala, ou `undefined` se ela ainda não tem voz. */
  hashGravado(idFala: string): string | undefined;
  gravar(idFala: string, registro: VozGravada, audio: Audio): Promise<void>;
  ler(idFala: string): Promise<VozGravada>;
}
