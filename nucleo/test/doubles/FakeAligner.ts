import type { Alinhador } from '../../src/aplicacao/portas/Alinhador.ts';
import type { Audio } from '../../src/dominio/fala/Audio.ts';
import { Palavras } from '../../src/dominio/fala/Palavras.ts';
import { Segundos } from '../../src/dominio/valores/Tempo.ts';

/** Divide a duração do áudio em partes iguais, uma por palavra do texto. */
export class AlinhadorFalso implements Alinhador {
  readonly textos: string[] = [];

  async alinhar(audio: Audio, texto: string): Promise<Palavras> {
    this.textos.push(texto);
    const palavras = Palavras.doTexto(texto);
    const parte = audio.duracao().valor() / palavras.textos().length;
    const inicios = palavras.textos().map((_, i) => Segundos.de(i * parte));
    const fins = palavras.textos().map((_, i) => Segundos.de((i + 1) * parte));
    return palavras.comTempos(inicios, fins);
  }
}
