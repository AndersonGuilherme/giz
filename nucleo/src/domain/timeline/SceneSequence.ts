import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { Fala } from '../roteiro/Fala.ts';
import type { CenaResolvida } from './PropsDoVideo.ts';

/** A cena de uma fala: a sua ou a herdada; `chave` muda só quando uma fala abre cena nova. */
export type CenaDaFala = Readonly<{ cena: CenaResolvida; chave: number; aberta: boolean }>;

const NENHUMA = -1;

/** A cena em tela ao longo das falas: a fala sem cena herda a anterior, com as mudanças das marcas. */
export class SequenciaDeCenas {
  #atual: CenaResolvida | undefined;
  #chave = NENHUMA;

  cenaDe(fala: Fala): CenaDaFala {
    const propria = fala.cena();
    if (propria) return this.#abrir(propria);
    if (!this.#atual) throw new ErroDeDominio(`fala ${fala.id()}: a primeira fala precisa de cena`);
    return { cena: this.#atual, chave: this.#chave, aberta: false };
  }

  /** A cena depois das marcas da fala: é a que a fala seguinte herda, se não abrir outra. */
  continuarCom(cena: CenaResolvida): void {
    this.#atual = cena;
  }

  #abrir(cena: CenaResolvida): CenaDaFala {
    this.#atual = { ...cena };
    this.#chave += 1;
    return { cena: this.#atual, chave: this.#chave, aberta: true };
  }
}
