import type { Cena } from '../roteiro/Cena.ts';
import type { Idioma } from '../valores/Idioma.ts';
import type { Proporcao } from '../valores/Proporcao.ts';
import type { Caixas } from './Caixas.ts';

export type TipoDeCena = Cena['tipo'];
type CenaDoTipo<T extends TipoDeCena> = Extract<Cena, Readonly<{ tipo: T }>>;

/** Contrato de toda cena: as caixas que ela ocupa numa proporção e num idioma. */
export type LayoutDeCena<T extends TipoDeCena = TipoDeCena> = (cena: CenaDoTipo<T>, proporcao: Proporcao, idioma: Idioma) => Caixas;

/** Mapa do tipo de cena para o seu layout; cada cena se registra, sem `switch`. */
export class RegistroDeLayouts {
  readonly #layouts: Map<TipoDeCena, LayoutDeCena>;

  private constructor(layouts: Map<TipoDeCena, LayoutDeCena>) {
    this.#layouts = layouts;
  }

  static vazio(): RegistroDeLayouts {
    return new RegistroDeLayouts(new Map());
  }

  registrar<T extends TipoDeCena>(tipo: T, layout: LayoutDeCena<T>): RegistroDeLayouts {
    // O mapa só entrega a função a cenas do tipo com que ela foi registrada; por isso a conversão é segura.
    this.#layouts.set(tipo, (cena, proporcao, idioma) => layout(cena as CenaDoTipo<T>, proporcao, idioma));
    return this;
  }

  /** `undefined` quando o tipo de cena ainda não tem layout registrado. */
  caixasDe(cena: Cena, proporcao: Proporcao, idioma: Idioma): Caixas | undefined {
    const layout = this.#layouts.get(cena.tipo);
    return layout?.(cena, proporcao, idioma);
  }
}
