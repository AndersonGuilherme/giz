import type { Fonetizador } from '../../src/aplicacao/portas/Fonetizador.ts';

/** Devolve sempre a mesma fonética: "mama" (visemas M A M A). */
export class FonetizadorFalso implements Fonetizador {
  async ipa(): Promise<string> {
    return 'mama';
  }
}
