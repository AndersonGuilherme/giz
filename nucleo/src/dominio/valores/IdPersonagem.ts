import { ErroDeDominio } from '../ErroDeDominio.ts';

const FORMATO_VALIDO = /^[a-z0-9-]{1,32}$/;

export class IdPersonagem {
  static readonly NARRADOR = new IdPersonagem('narrador');

  readonly #texto: string;

  private constructor(texto: string) {
    this.#texto = texto;
  }

  static de(texto: string): IdPersonagem {
    if (!FORMATO_VALIDO.test(texto)) {
      throw new ErroDeDominio(`id de personagem "${texto}" inválido (use de 1 a 32 caracteres entre a-z, 0-9 e "-")`);
    }
    return new IdPersonagem(texto);
  }

  eNarrador(): boolean {
    return this.igual(IdPersonagem.NARRADOR);
  }

  texto(): string {
    return this.#texto;
  }

  igual(outro: IdPersonagem): boolean {
    return this.#texto === outro.#texto;
  }
}
