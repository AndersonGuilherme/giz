# giz nucleo

Motor de vídeos animados em camadas (`dominio`, `aplicacao`, `infraestrutura`, `apresentacao`).

- `npm run verificar` roda typecheck, lint (ESLint + dependency-cruiser) e testes.
- Regras: Object Calisthenics e SOLID, impostas pelo ESLint; exceções só com `// calisthenics-exceção: <motivo>`.
- Camadas impostas pelo dependency-cruiser; a única exceção é `src/apresentacao/cli/composicao.ts`.
- Node >= 22.18 roda TypeScript direto: só sintaxe apagável, imports com extensão `.ts`/`.tsx`.
- Instalação: `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install`.
