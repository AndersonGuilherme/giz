import type { Audio } from '../../dominio/fala/Audio.ts';
import type { Palavras } from '../../dominio/fala/Palavras.ts';
import type { Idioma } from '../../dominio/valores/Idioma.ts';

/** Descobre quando cada palavra de `texto` (o texto do roteiro) é dita no áudio. */
export interface Alinhador {
  alinhar(audio: Audio, texto: string, idioma: Idioma): Promise<Palavras>;
}
