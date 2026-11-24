import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { IdPersonagem } from '../valores/IdPersonagem.ts';
import type { Personagem } from './Personagem.ts';

function idEmTexto(personagem: Personagem): string {
  const id = personagem.id();
  return id.texto();
}

export class Elenco {
  readonly #personagens: readonly Personagem[];

  private constructor(personagens: readonly Personagem[]) {
    this.#personagens = personagens;
  }

  static de(personagens: readonly Personagem[]): Elenco {
    return new Elenco([...personagens]);
  }

  contem(id: IdPersonagem): boolean {
    return this.#personagens.some((personagem) => personagem.temId(id));
  }

  personagem(id: IdPersonagem): Personagem {
    const encontrado = this.#personagens.find((personagem) => personagem.temId(id));
    if (!encontrado) throw new ErroDeDominio(`"${id.texto()}" não está no elenco (${this.ids().join(', ')})`);
    return encontrado;
  }

  cadaUm(): readonly Personagem[] {
    return this.#personagens;
  }

  ids(): string[] {
    return this.#personagens.map(idEmTexto);
  }
}
