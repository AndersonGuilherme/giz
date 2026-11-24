# giz nucleo

Motor de vídeos animados em camadas (`domain`, `application`, `infrastructure`, `presentation`).

- `npm run verify` roda typecheck, lint (ESLint + dependency-cruiser) e testes.
- Regras: Object Calisthenics e SOLID, impostas pelo ESLint; exceções só com `// calisthenics-exceção: <motivo>`.
- Camadas impostas pelo dependency-cruiser; a única exceção é `src/presentation/cli/composition.ts`.
- Node >= 22.18 roda TypeScript direto: só sintaxe apagável, imports com extensão `.ts`/`.tsx`.
- Código em inglês (identificadores, arquivos, chaves dos JSON do projeto, subcomandos); textos que a pessoa usuária vê seguem em pt-BR.
- Um projeto é uma pasta com `project.json`, `script.json` e `cast/<id>.json`; as vozes geradas ficam em `voice/` e as gravações próprias em `recordings/`.
- CLI: `node src/presentation/cli/giz.ts <voice | check> <pasta-do-projeto>`.
- Instalação: `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install`.
- Character sheet of a rig: `npx remotion still src/presentation/remotion/index.ts CharacterSheet output/sheet-ball-head.png --props='{"rig":"ball-head"}'` (`output/` is gitignored). Add `"character":"cast/<id>.json"` with `--public-dir=<project>` to use a cast member's parameters. Webpack resolves the explicit `.ts`/`.tsx` imports without a `remotion.config.ts`.
