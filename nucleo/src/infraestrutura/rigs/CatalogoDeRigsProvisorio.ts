import type { CatalogoDeRigs, DefinicaoDeParametros } from '../../aplicacao/portas/CatalogoDeRigs.ts';

// Provisório até o catálogo real (a partir do registro de rigs, Task 10): só o rig "teste" das fixtures.
const RIGS: Readonly<Record<string, DefinicaoDeParametros>> = {
  teste: {
    pele: { tipo: 'cor', padrao: '#f0c8a0' },
    altura: { tipo: 'numero', padrao: 1, min: 0.5, max: 1.5 },
    cabelo: { tipo: 'opcao', padrao: 'curto', opcoes: ['curto', 'longo'] },
    oculos: { tipo: 'booleano', padrao: false },
  },
};

export class CatalogoDeRigsProvisorio implements CatalogoDeRigs {
  definicao(idRig: string): DefinicaoDeParametros | undefined {
    return RIGS[idRig];
  }

  ids(): string[] {
    return Object.keys(RIGS);
  }
}
