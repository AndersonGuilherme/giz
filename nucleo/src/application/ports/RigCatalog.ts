export type TipoDeParametro = 'cor' | 'numero' | 'opcao' | 'booleano';

export type DefinicaoDeParametro = {
  tipo: TipoDeParametro;
  padrao: string | number | boolean;
  min?: number;
  max?: number;
  opcoes?: string[];
};

export type DefinicaoDeParametros = Record<string, DefinicaoDeParametro>;

/** Os rigs disponíveis e os parâmetros que cada um aceita. */
export interface CatalogoDeRigs {
  definicao(idRig: string): DefinicaoDeParametros | undefined;
  ids(): string[];
}
