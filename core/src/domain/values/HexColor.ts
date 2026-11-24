import { DomainError } from '../DomainError.ts';

const SHORT_FORMAT = /^#[0-9a-f]{3}$/i;
const LONG_FORMAT = /^#[0-9a-f]{6}$/i;

function expanded(text: string): string {
  if (!SHORT_FORMAT.test(text)) return text.toLowerCase();
  const [, red, green, blue] = text.toLowerCase();
  return `#${red}${red}${green}${green}${blue}${blue}`;
}

function darkenedChannel(channel: string, factor: number): string {
  const darkened = Math.round(Number.parseInt(channel, 16) * (1 - factor));
  return darkened.toString(16).padStart(2, '0');
}

export class HexColor {
  readonly #text: string;

  private constructor(text: string) {
    this.#text = text;
  }

  static of(text: string): HexColor {
    if (!SHORT_FORMAT.test(text) && !LONG_FORMAT.test(text)) {
      throw new DomainError(`cor "${text}" inválida (use #RGB ou #RRGGBB)`);
    }
    return new HexColor(expanded(text));
  }

  css(): string {
    return this.#text;
  }

  darkened(factor: number): HexColor {
    if (!(factor >= 0 && factor <= 1)) {
      throw new DomainError(`fator ${factor} inválido (use um número entre 0 e 1)`);
    }
    const channels = this.#text.slice(1).match(/../g) ?? [];
    return new HexColor(`#${channels.map((channel) => darkenedChannel(channel, factor)).join('')}`);
  }
}
