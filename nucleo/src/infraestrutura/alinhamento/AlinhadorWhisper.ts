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

const nadaAAvisar = () => undefined;
const motivoDe = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro));

/**
 * Tempos do que o Whisper ouviu, presos às palavras do roteiro. Se o alinhamento for ruim demais, ou se o Whisper
 * falhar (sem rede para baixar o modelo, erro do onnx), usa a reserva: a voz da fala nunca se perde por isso.
 */
export class AlinhadorWhisper implements Alinhador {
  readonly #reserva: Alinhador;
  readonly #ouvido: Ouvido;
  readonly #aoAvisar: (mensagem: string) => void;

  constructor(reserva: Alinhador, ouvido: Ouvido, aoAvisar: (mensagem: string) => void = nadaAAvisar) {
    this.#reserva = reserva;
    this.#ouvido = ouvido;
    this.#aoAvisar = aoAvisar;
  }

  async alinhar(audio: Audio, texto: string, idioma: Idioma): Promise<Palavras> {
    const ouvidas = await this.#ouvir(audio, idioma);
    const reconciliadas = ouvidas && reconciliar(Palavras.doTexto(texto), ouvidas, audio.duracao());
    return reconciliadas ?? this.#reserva.alinhar(audio, texto, idioma);
  }

  async #ouvir(audio: Audio, idioma: Idioma): Promise<PalavraJson[] | null> {
    try {
      return await this.#ouvido.ouvir(audio, idioma);
    } catch (erro) {
      this.#aoAvisar(`alinhamento por Whisper falhou (${motivoDe(erro)}); usando o envelope da voz`);
      return null;
    }
  }
}
