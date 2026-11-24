import type { Idioma } from '../valores/Idioma.ts';

export type Visema = 'X' | 'M' | 'A' | 'E' | 'I' | 'O' | 'U' | 'F' | 'C';

type FonemasPorVisema = Readonly<Partial<Record<Visema, string>>>;

// Fonema → forma de boca, um objeto por idioma. X = repouso; o que não está na tabela vira C (consoante).
const TABELAS: Readonly<Record<string, FonemasPorVisema>> = {
  'pt-BR': { 'A': 'aɐɑ', 'E': 'eɛə', 'I': 'iɪj', 'O': 'oɔ', 'U': 'uʊw', 'M': 'mbp', 'F': 'fv' },
  en: { 'A': 'aɐɑʌæ', 'E': 'eɛəɜɚ', 'I': 'iɪj', 'O': 'oɔ', 'U': 'uʊw', 'M': 'mbp', 'F': 'fv', 'C': 'θð' },
};

const IGNORADOS = /[̀-ͯˈˌː\s,.;:!?…]/;

export class SequenciaDeVisemas {
  readonly #visemas: readonly Visema[];

  constructor(visemas: readonly Visema[]) {
    this.#visemas = visemas;
  }

  texto(): string {
    return this.#visemas.join('');
  }

  // Espalha os visemas, em ordem, pelos quadros com voz; os demais ficam em repouso (X).
  espalharSobre(quadrosComVoz: readonly boolean[]): string {
    const totalComVoz = quadrosComVoz.filter(Boolean).length;
    let vistos = 0;
    return quadrosComVoz
      .map((comVoz) => (comVoz ? this.#visemaDoQuadro(vistos++, totalComVoz) : 'X'))
      .join('');
  }

  #visemaDoQuadro(posicao: number, totalComVoz: number): Visema {
    const indice = Math.floor((posicao * this.#visemas.length) / totalComVoz);
    return this.#visemas[indice] ?? 'X';
  }
}

export class MapaDeVisemas {
  readonly #porFonema: ReadonlyMap<string, Visema>;

  private constructor(porFonema: ReadonlyMap<string, Visema>) {
    this.#porFonema = porFonema;
  }

  static para(idioma: Idioma): MapaDeVisemas {
    const tabela = TABELAS[idioma.codigo()] ?? {};
    const pares = Object.entries(tabela).flatMap(([visema, fonemas]) =>
      [...(fonemas ?? '')].map((fonema): [string, Visema] => [fonema, visema as Visema]),
    );
    return new MapaDeVisemas(new Map(pares));
  }

  converter(ipa: string): SequenciaDeVisemas {
    const fonemas = [...ipa.normalize('NFD')].filter((caractere) => !IGNORADOS.test(caractere));
    return new SequenciaDeVisemas(fonemas.map((fonema) => this.#porFonema.get(fonema) ?? 'C'));
  }
}
