import type { CatalogoDeRigs, DefinicaoDeParametros } from '../../src/aplicacao/portas/CatalogoDeRigs.ts';

const RIG_DE_TESTE: DefinicaoDeParametros = {
  pele: { tipo: 'cor', padrao: '#f0c8a0' },
  altura: { tipo: 'numero', padrao: 1, min: 0.5, max: 1.5 },
  cabelo: { tipo: 'opcao', padrao: 'curto', opcoes: ['curto', 'longo'] },
  oculos: { tipo: 'booleano', padrao: false },
};

export class CatalogoDeRigsFalso implements CatalogoDeRigs {
  definicao(idRig: string): DefinicaoDeParametros | undefined {
    return idRig === 'teste' ? RIG_DE_TESTE : undefined;
  }

  ids(): string[] {
    return ['teste'];
  }
}
