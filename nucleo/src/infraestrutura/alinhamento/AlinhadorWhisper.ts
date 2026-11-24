import type { Alinhador } from '../../aplicacao/portas/Alinhador.ts';
import type { Audio } from '../../dominio/fala/Audio.ts';
import type { PalavraJson } from '../../dominio/fala/PalavraJson.ts';
import { Palavras } from '../../dominio/fala/Palavras.ts';
import { reconciliar } from '../../dominio/fala/Reconciliacao.ts';
import type { Idioma } from '../../dominio/valores/Idioma.ts';

/** Reconhecimento de fala: as palavras ouvidas, com o tempo de cada uma. */
export interface Ouvido {
  ouvir(audio: Audio, idioma: Idioma): Promise<PalavraJson[]>;
}

/** Tempos do que o Whisper ouviu, presos às palavras do roteiro; se o alinhamento for ruim demais, usa a reserva. */
export class AlinhadorWhisper implements Alinhador {
  readonly #reserva: Alinhador;
  readonly #ouvido: Ouvido;

  constructor(reserva: Alinhador, ouvido: Ouvido) {
    this.#reserva = reserva;
    this.#ouvido = ouvido;
  }

  async alinhar(audio: Audio, texto: string, idioma: Idioma): Promise<Palavras> {
    const ouvidas = await this.#ouvido.ouvir(audio, idioma);
    const reconciliadas = reconciliar(Palavras.doTexto(texto), ouvidas);
    return reconciliadas ?? this.#reserva.alinhar(audio, texto, idioma);
  }
}
