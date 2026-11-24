import { ErroDeDominio } from '../ErroDeDominio.ts';

const FORMATO_CURTO = /^#[0-9a-f]{3}$/i;
const FORMATO_LONGO = /^#[0-9a-f]{6}$/i;

function expandida(texto: string): string {
  if (!FORMATO_CURTO.test(texto)) return texto.toLowerCase();
  const [, vermelho, verde, azul] = texto.toLowerCase();
  return `#${vermelho}${vermelho}${verde}${verde}${azul}${azul}`;
}

function canalEscurecido(canal: string, fator: number): string {
  const escurecido = Math.round(Number.parseInt(canal, 16) * (1 - fator));
  return escurecido.toString(16).padStart(2, '0');
}

export class CorHex {
  readonly #texto: string;

  private constructor(texto: string) {
    this.#texto = texto;
  }

  static de(texto: string): CorHex {
    if (!FORMATO_CURTO.test(texto) && !FORMATO_LONGO.test(texto)) {
      throw new ErroDeDominio(`cor "${texto}" inválida (use #RGB ou #RRGGBB)`);
    }
    return new CorHex(expandida(texto));
  }

  css(): string {
    return this.#texto;
  }

  escurecida(fator: number): CorHex {
    if (!(fator >= 0 && fator <= 1)) {
      throw new ErroDeDominio(`fator ${fator} inválido (use um número entre 0 e 1)`);
    }
    const canais = this.#texto.slice(1).match(/../g) ?? [];
    return new CorHex(`#${canais.map((canal) => canalEscurecido(canal, fator)).join('')}`);
  }
}
