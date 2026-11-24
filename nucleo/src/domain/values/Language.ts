import { ErroDeDominio } from '../ErroDeDominio.ts';

type CodigoDeIdioma = 'pt-BR' | 'en';
type VozEspeak = 'pt-br' | 'en-us';

export class Idioma {
  static readonly PORTUGUES = new Idioma('pt-BR', 'pt-br');
  static readonly INGLES = new Idioma('en', 'en-us');

  readonly #codigo: CodigoDeIdioma;
  readonly #voz: VozEspeak;

  private constructor(codigo: CodigoDeIdioma, voz: VozEspeak) {
    this.#codigo = codigo;
    this.#voz = voz;
  }

  static de(codigo: string): Idioma {
    const suportados = [Idioma.PORTUGUES, Idioma.INGLES];
    const encontrado = suportados.find((idioma) => idioma.#codigo === codigo);
    if (!encontrado) throw new ErroDeDominio(`idioma "${codigo}" não suportado (use pt-BR ou en)`);
    return encontrado;
  }

  codigo(): CodigoDeIdioma {
    return this.#codigo;
  }

  vozEspeak(): VozEspeak {
    return this.#voz;
  }

  igual(outro: Idioma): boolean {
    return this.#codigo === outro.#codigo;
  }
}
