/** Regras de camada do núcleo. A única exceção é src/apresentacao/cli/composicao.ts. */
const DOMINIO = '^src/dominio/';
const APLICACAO = '^src/aplicacao/';
const INFRA = '^src/infraestrutura/';
const APRESENTACAO = '^src/apresentacao/';
const COMPOSICAO = '^src/apresentacao/cli/composicao\\.ts$';

module.exports = {
  forbidden: [
    {
      name: 'dominio-so-importa-dominio',
      comment: 'dominio não importa nada fora de dominio (nem React, node:* ou zod).',
      severity: 'error',
      from: { path: DOMINIO },
      to: { pathNot: DOMINIO },
    },
    {
      name: 'aplicacao-so-importa-dominio',
      comment: 'aplicacao importa só dominio (e a si mesma).',
      severity: 'error',
      from: { path: APLICACAO },
      to: { pathNot: [APLICACAO, DOMINIO] },
    },
    {
      name: 'infraestrutura-nao-importa-apresentacao',
      severity: 'error',
      from: { path: INFRA },
      to: { path: APRESENTACAO },
    },
    {
      name: 'apresentacao-nao-importa-infraestrutura',
      comment: 'Exceção única: o ponto de composição.',
      severity: 'error',
      from: { path: APRESENTACAO, pathNot: COMPOSICAO },
      to: { path: INFRA },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    includeOnly: undefined,
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
  },
};
