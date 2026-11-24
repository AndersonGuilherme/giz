import type { Idioma } from '../../dominio/valores/Idioma.ts';

export interface Fonetizador {
  ipa(texto: string, idioma: Idioma): Promise<string>;
}
