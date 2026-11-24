import type { Projeto } from '../../dominio/projeto/Projeto.ts';

/** Carrega um projeto de uma pasta; falha com `ErroDeProjeto` listando todos os problemas encontrados. */
export interface RepositorioDeProjeto {
  carregar(pasta: string): Promise<Projeto>;
}
