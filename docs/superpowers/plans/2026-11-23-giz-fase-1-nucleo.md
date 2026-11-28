# giz Estúdio — Fase 1: Núcleo — Plano de implementação

> **Note (2026-11-27):** the project was renamed before its first public release: giz → **Gizzycera**, giz Estúdio → **Gizzycera** (the app), the CLI `giz` → `gizzy`, the rig `giz` → `gizzy`, `giz.config.json` → `gizzycera.config.json`, `GIZ_*` → `GIZZY_*`. This document keeps the names of its time; the README's "Vindo do giz" section maps them.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** criar o pacote `nucleo/`, um motor novo e organizado que transforma um projeto em JSON (roteiro v2 +
elenco livre + cenários) num vídeo MP4 com legendas, em 9:16 ou 16:9, falado em pt-BR ou en, com personagens
montados por partes e cenas no estilo das referências e no estilo aula.

**Architecture:** portas e adaptadores em quatro camadas (`dominio` → `aplicacao` → `infraestrutura` /
`apresentacao`). O domínio é TypeScript puro com objetos de valor, testado com `node:test`. Os adaptadores ligam
espeak, Qwen, Whisper, disco e Remotion. Os componentes Remotion só desenham o que o domínio calcula. Cenas, rigs
e efeitos entram por registro.

**Tech Stack:** Node ≥ 22.18 (roda .ts direto), TypeScript strict, React 18, Remotion 4.0.545, zod, ESLint 9,
dependency-cruiser, `@echogarden/espeak-ng-emscripten`, `@huggingface/transformers` 3.8.1, `onnxruntime-node` 1.31.1.

**Spec:** `docs/superpowers/specs/2026-11-23-giz-estudio-design.md` (seções 5.1, 5.1.1, 5.2–5.5, 5.11 e fase 1 da seção 6).

## Global Constraints

- **Não tocar em `motor/` nem em `cursos/`.** A fila da ElevenLabs e a publicação dependem deles. Ler e copiar pode; editar não.
- Camadas: `src/dominio` não importa nada fora de `src/dominio` (nem React, `node:*` ou zod); `src/aplicacao` importa só `dominio`; `src/infraestrutura` e `src/apresentacao` importam `aplicacao` e `dominio`, nunca uma à outra, **exceto** `src/apresentacao/cli/composicao.ts`, que é o único ponto de composição. O dependency-cruiser falha o build se essa regra for quebrada.
- Object Calisthenics (seção 5.1.1 do spec): um nível de indentação por função; sem `else`; primitivos de domínio embrulhados; coleções de primeira classe; um ponto por linha em `dominio` e `aplicacao`; nomes sem abreviação; arquivo ≤ 150 linhas; função ≤ 20 linhas; ≤ 3 parâmetros; ≤ 2 campos de estado por classe de domínio; sem getter/setter anêmico. Exceções só com o comentário `// calisthenics-exceção: <motivo>`.
- **Node roda o TypeScript tirando os tipos**: só sintaxe apagável (`"erasableSyntaxOnly": true`). Sem `enum`, sem `namespace` e sem *parameter properties* (`constructor(private x)`). Campos privados usam `#campo`. Os imports levam a extensão explícita `.ts`/`.tsx`.
- O idioma é sempre `pt-BR` ou `en`; a proporção é sempre `9:16` (1080×1920) ou `16:9` (1920×1080); FPS = 30.
- Visemas (formas de boca) usam o alfabeto do motor: `X M A E I O U F C` (X = repouso).
- Nenhum texto pode sobrepor ou sair da área segura (lição 32): toda cena declara as caixas que ocupa e o `check` falha se houver problema.
- Movimento contido (lições 25–26): gesto forte uma vez quando a pose começa; respiração leve; quem escuta reage só com o corpo.
- Sem marca pessoal/de terceiros nem dados pessoais em nada que vá para o repositório.
- Commits locais na branch `estudio/fase-1`. **Push só com autorização do Anderson.** Os commits usam o e-mail noreply já configurado no repo.
- `motor/src/textFit.ts` e `motor/src/graphLayout.ts` **não estão no git** (os arquivos de `motor/` com alterações ainda não commitadas aguardam autorização). Se a execução usar um worktree, copie-os de `motor/src/` no checkout principal.
- Comandos rodam em `nucleo/`, salvo quando indicado. O pacote instala com `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install`.

## Review Focus

1. **Texto longo em 9:16:** uma fala de 300 caracteres, um título de 80 ou um código de 20 linhas na tela estreita. O esperado é que o texto encolha ou quebre, e que o `check` aponte o que ainda não couber. Nunca pode sair cortado ou sobreposto. (Teste no Task 8.)
2. **Imagem de cenário ausente ou com proporção errada:** o `check` dá erro legível, com o caminho e a fala. O render não quebra: usa o fundo vetorial padrão e avisa. (Testes nos Tasks 3 e 12.)
3. **Fala de um personagem que não está no elenco, ou parâmetro de rig inválido** (cor `"roxo"`, modelo inexistente): o erro de validação diz o arquivo, o campo e o valor, e não mostra um stack trace. (Teste no Task 3.)
4. **Palavras em inglês dentro de fala em pt-BR** ("deploy", "pull request"), e o contrário: a boca não trava e o alinhamento não perde a ordem. A legenda mostra o texto do roteiro, não o que o Whisper ouviu. (Testes nos Tasks 4 e 6.)
5. **O Whisper devolve outro número de palavras que o roteiro** (junta, separa ou erra palavras): a reconciliação mantém as palavras do roteiro em ordem crescente de tempo e cai para a interpolação por envelope se o alinhamento for ruim demais. (Teste no Task 6.)

---

### Task 1: Esqueleto do pacote, regras de qualidade e primeiros objetos de valor

**Files:**
- Create: `nucleo/package.json`, `nucleo/tsconfig.json`, `nucleo/eslint.config.js`, `nucleo/.dependency-cruiser.cjs`, `nucleo/README.md`
- Create: `nucleo/src/dominio/valores/Idioma.ts`, `nucleo/src/dominio/valores/Proporcao.ts`, `nucleo/src/dominio/ErroDeDominio.ts`
- Test: `nucleo/test/dominio/valores/Idioma.test.ts`, `nucleo/test/dominio/valores/Proporcao.test.ts`

**Interfaces:**
- Produces:
  - `class ErroDeDominio extends Error`, com `constructor(mensagem: string)`
  - `class Idioma`: `static de(codigo: string): Idioma` (lança `ErroDeDominio` fora de `pt-BR`/`en`); `static readonly PORTUGUES`, `static readonly INGLES`; `codigo(): 'pt-BR' | 'en'`; `vozEspeak(): 'pt-br' | 'en-us'`; `igual(outro: Idioma): boolean`
  - `class Proporcao`: `static de(texto: string): Proporcao` (`'9:16' | '16:9'`); `largura(): number`; `altura(): number`; `vertical(): boolean`; `texto(): '9:16' | '16:9'`
- Scripts de `package.json`: `test` (`node --test "test/**/*.test.ts"`), `typecheck` (`tsc --noEmit`), `lint` (`eslint . && depcruise src`), `verificar` (typecheck + lint + test)

- [ ] **Step 1: Write the failing tests**

```ts
test('Idioma aceita pt-BR e en e diz a voz do espeak', () => {
  assert.equal(Idioma.de('pt-BR').vozEspeak(), 'pt-br');
  assert.equal(Idioma.de('en').vozEspeak(), 'en-us');
  assert.ok(Idioma.de('en').igual(Idioma.INGLES));
});
test('Idioma recusa código desconhecido com mensagem legível', () => {
  assert.throws(() => Idioma.de('es'), { name: 'ErroDeDominio', message: /idioma "es" não suportado.*pt-BR.*en/ });
});
test('Proporcao 9:16 é vertical 1080x1920', () => {
  const p = Proporcao.de('9:16');
  assert.deepEqual([p.largura(), p.altura(), p.vertical()], [1080, 1920, true]);
});
test('Proporcao recusa 4:3', () => assert.throws(() => Proporcao.de('4:3'), /proporção "4:3"/));
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL, com o módulo `Idioma.ts` não encontrado.

- [ ] **Step 3: Create the package files and the two value objects**

O `tsconfig` usa `strict`, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `jsx: react-jsx`, `moduleResolution: bundler` e `types: ["node"]`. As dependências ficam com as versões do Tech Stack, e o `devDependencies` inclui `eslint`, `typescript-eslint`, `dependency-cruiser` e `@types/react`.

O ESLint aplica:
- `max-depth: [error, 1]` e `no-else-return`;
- `no-restricted-syntax` contra `IfStatement[alternate]`;
- `max-lines: 150`, `max-lines-per-function: 20` e `max-params: 3`;
- `complexity: 6` e `id-length: { min: 2, exceptions: ['x','y'] }`.

As exceções só valem por comentário. O `.dependency-cruiser.cjs` codifica as regras de camada dos Global Constraints.

- [ ] **Step 4: Run all the checks and confirm they pass**

Run: `npm run verificar`
Expected: typecheck sem erros, lint sem erros, 4 testes passando.

- [ ] **Step 5: Prove that the rules actually block bad code**

Crie temporariamente `src/dominio/ruim.ts` com um `if/else` aninhado e um `import 'node:fs'`. Rode `npm run lint` e confirme que ele falha com `max-depth`, `IfStatement[alternate]` e a regra de camada. Depois apague o arquivo.

- [ ] **Step 6: Commit**

```bash
git add nucleo && git commit -m "nucleo: esqueleto, regras de qualidade e objetos de valor Idioma/Proporcao"
```

### Task 2: Valores de tempo, cor e identidade

**Files:**
- Create: `nucleo/src/dominio/valores/Tempo.ts` (`Segundos`, `Quadro`, `Fps`), `nucleo/src/dominio/valores/CorHex.ts`, `nucleo/src/dominio/valores/IdPersonagem.ts`
- Test: `nucleo/test/dominio/valores/Tempo.test.ts`, `CorHex.test.ts`, `IdPersonagem.test.ts`

**Interfaces:**
- Produces:
  - `class Fps`: `static readonly PADRAO` (30); `valor(): number`
  - `class Segundos`: `static de(n: number)`; `emQuadros(fps: Fps): Quadro` (arredonda para cima); `mais(outro: Segundos): Segundos`; `valor(): number`
  - `class Quadro`: `static de(n: number)` (inteiro ≥ 0); `mais(outro: Quadro): Quadro`; `menos(outro: Quadro): Quadro` (nunca negativo); `antesDe(outro: Quadro): boolean`; `valor(): number`
  - `class CorHex`: `static de(texto: string)` (`#RGB` ou `#RRGGBB`); `css(): string`; `escurecida(fator: number): CorHex`
  - `class IdPersonagem`: `static de(texto: string)` (`[a-z0-9-]{1,32}`); `static readonly NARRADOR`; `eNarrador(): boolean`; `texto(): string`; `igual(o: IdPersonagem): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
test('1,5 s a 30 fps são 45 quadros; 1,51 s arredonda para 46', () => {
  assert.equal(Segundos.de(1.5).emQuadros(Fps.PADRAO).valor(), 45);
  assert.equal(Segundos.de(1.51).emQuadros(Fps.PADRAO).valor(), 46);
});
test('Quadro nunca fica negativo', () => assert.equal(Quadro.de(3).menos(Quadro.de(5)).valor(), 0));
test('Quadro recusa fração e negativo', () => { assert.throws(() => Quadro.de(1.5)); assert.throws(() => Quadro.de(-1)); });
test('CorHex recusa nome de cor com mensagem', () => assert.throws(() => CorHex.de('roxo'), /cor "roxo".*#RRGGBB/));
test('CorHex escurece #ffffff em 50% para #808080', () => assert.equal(CorHex.de('#ffffff').escurecida(0.5).css(), '#808080'));
test('IdPersonagem aceita "ana-2" e recusa "Ana Maria"', () => { IdPersonagem.de('ana-2'); assert.throws(() => IdPersonagem.de('Ana Maria'), /id de personagem/); });
test('narrador é um id reservado', () => assert.ok(IdPersonagem.de('narrador').eNarrador()));
```

- [ ] **Step 2: Run the tests and confirm they fail** — `npm test`; FAIL, módulos ausentes.
- [ ] **Step 3: Implement the value objects** listed in Interfaces (`#valor` privado, construtor privado por convenção e criação só por `de`).
- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: valores de tempo, cor e identidade"`

### Task 3: Projeto, roteiro v2 e elenco — domínio, esquema e leitura do disco

**Files:**
- Create: `nucleo/src/dominio/elenco/Personagem.ts`, `nucleo/src/dominio/elenco/Elenco.ts`
- Create: `nucleo/src/dominio/roteiro/Fala.ts`, `Falas.ts`, `Cena.ts` (tipos das cenas), `Roteiro.ts`, `nucleo/src/dominio/projeto/Projeto.ts`
- Create: `nucleo/src/aplicacao/portas/RepositorioDeProjeto.ts`
- Create: `nucleo/src/infraestrutura/esquema/esquemaDoProjeto.ts`, `esquemaDoRoteiro.ts`, `esquemaDoPersonagem.ts`, `paraDominio.ts`, `mensagensDeErro.ts`
- Create: `nucleo/src/infraestrutura/disco/RepositorioDeProjetoEmDisco.ts`
- Create: `nucleo/test/fixtures/projeto-minimo/` (projeto.json, roteiro.json, elenco/ana.json)
- Test: `nucleo/test/dominio/roteiro/Roteiro.test.ts`, `nucleo/test/infraestrutura/disco/RepositorioDeProjetoEmDisco.test.ts`

**Interfaces:**
- Consumes: os valores dos Tasks 1 e 2.
- Produces:
  - **`projeto.json`:**
    `{ versao: 2, titulo, formato: 'historia'|'aula', idioma, proporcao, marca?: string, estiloDeLegenda: 'palavras'|'blocos', elenco: string[] /* ids */, voz: { provedor: 'qwen'|'arquivo', modelo?: '0.6b'|'1.7b' } }`
  - **`elenco/<id>.json`:**
    `{ id, nome, rig: string, parametros: Record<string, string|number|boolean>, voz: { id: string, estilo?: string }, personalidade?: string, expressaoPadrao: Expressao }`
  - **`roteiro.json`:**
    `{ capitulos: string[], falas: Fala[] }`, em que `Fala` tem `id`, `capitulo`, `quem`, `texto`, `pronuncia?` (o antigo `say`), `pose?`, `expressao?`, `olhar?: 'camera'|'outro'|'conteudo'`, `reacao?`, `cena?`, `marcas?` (os antigos beats), `pausaDepois?: { segundos, rotulo }`, `efeitoSonoro?`
  - **`Cena`:** a união de `{ tipo: 'cenario', fundo: { imagem?: string, vetorial?: string, cores?: Record<string,string> }, personagens: PersonagemEmCena[], camera?: MovimentoDeCamera, efeitos?: Efeito[], hud?: Hud, destaque?: TextoGrande }` com as cenas de aula: `titulo | cartao | citacao | grafico | sintomas | codigo | terminal | grafo | versus | tabela | conversa`. A cena `codigo` tem `{ tipo: 'codigo', titulo, linhas: string[], adicionadas?: number[], destaque?: string[] }`, com o código **embutido**. `casa` e `inbox` do motor ficam de fora (são específicas do SOLID).
  - **`PersonagemEmCena`:** `{ quem, posicao: 'esquerda'|'centro'|'direita'|{x:number,y:number}, escala?: number, direcao?: 'frente'|'esquerda'|'direita' }`
  - **Tipos de domínio:** `type Pose = 'neutra'|'explicar'|'apontar'|'acenar'|'levantar'|'pensar'|'ombros'|'comemorar'|'mao-na-cabeca'|'maos-na-boca'` e `type Expressao = 'neutra'|'feliz'|'animada'|'surpresa'|'confusa'|'pensativa'|'cetica'|'preocupada'|'brava'|'assustada'`
  - **`class Elenco`:** `contem(id: IdPersonagem): boolean`, `personagem(id: IdPersonagem): Personagem` e `cadaUm(): readonly Personagem[]`
  - **`class Falas`:** `cadaUma(): readonly Fala[]`, `quantidade(): number` e `idsDesconhecidos(elenco: Elenco): string[]`
  - **`class Projeto`:** `titulo()`, `idioma(): Idioma`, `proporcao(): Proporcao`, `formato()`, `elenco(): Elenco` e `roteiro(): Roteiro`
  - **Porta `interface RepositorioDeProjeto`:** `carregar(pasta: string): Promise<Projeto>`
  - **`class RepositorioDeProjetoEmDisco implements RepositorioDeProjeto`:** valida com zod e converte para o domínio. Os erros saem agregados num `ErroDeProjeto` com a lista `{ arquivo, caminho, mensagem }[]`.

- [ ] **Step 1: Write the failing tests**

```ts
test('carrega o projeto mínimo', async () => {
  const p = await new RepositorioDeProjetoEmDisco().carregar(fixture('projeto-minimo'));
  assert.equal(p.idioma().codigo(), 'pt-BR');
  assert.equal(p.roteiro().falas().quantidade(), 2);
  assert.ok(p.elenco().contem(IdPersonagem.de('ana')));
});
test('fala de personagem fora do elenco vira erro legível', async () => {
  await assert.rejects(carregarComRoteiro({ falas: [{ id: '1', capitulo: 1, quem: 'bia', texto: 'oi' }] }),
    { name: 'ErroDeProjeto', message: /roteiro\.json › falas\[0\]\.quem: "bia" não está no elenco \(ana\)/ });
});
test('cor inválida no personagem aponta arquivo e campo', async () => {
  await assert.rejects(carregarComPersonagem({ parametros: { pele: 'roxo' } }), /elenco\/ana\.json › parametros\.pele: cor "roxo"/);
});
test('vários erros saem juntos, não só o primeiro', async () => {
  const erro = await capturar(carregarComRoteiro({ falas: [{ id: '1' }, { id: '2' }] }));
  assert.ok(erro.problemas.length >= 4);
});
test('imagem de cenário ausente é aviso, não falha de carga', async () => {
  const p = await carregarComCena({ tipo: 'cenario', fundo: { imagem: 'cenarios/nao-existe.png' }, personagens: [] });
  assert.match(p.avisos().join('\n'), /cenarios\/nao-existe\.png não encontrada.*fala 1/);
});
```

(`carregarComRoteiro`, `carregarComPersonagem`, `carregarComCena` e `capturar` são ajudantes do teste que copiam a fixture para uma pasta temporária e aplicam a alteração.)

- [ ] **Step 2: Run the tests and confirm they fail** — `npm test`; FAIL.
- [ ] **Step 3: Implement the domain, the schema and the repository**

O esquema fica só na infraestrutura e o domínio não conhece o zod. `paraDominio.ts` faz a conversão, com uma função por entidade. Os avisos (como uma imagem ausente) ficam numa lista que `Projeto.avisos(): readonly string[]` expõe.

- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: projeto, roteiro v2 e elenco livre com validação legível"`

### Task 4: Fonemas e visemas por idioma

**Files:**
- Create: `nucleo/src/dominio/fala/Visemas.ts` (tipo `Visema`, `class SequenciaDeVisemas`, `class MapaDeVisemas`)
- Create: `nucleo/src/aplicacao/portas/Fonetizador.ts`
- Create: `nucleo/src/infraestrutura/fonetica/FonetizadorEspeak.ts`, `nucleo/src/infraestrutura/fonetica/normalizacao.ts`
- Test: `nucleo/test/dominio/fala/Visemas.test.ts`, `nucleo/test/infraestrutura/fonetica/FonetizadorEspeak.test.ts`

**Interfaces:**
- Produces:
  - `type Visema = 'X'|'M'|'A'|'E'|'I'|'O'|'U'|'F'|'C'`
  - **`class MapaDeVisemas`:** `static para(idioma: Idioma): MapaDeVisemas` e `converter(ipa: string): SequenciaDeVisemas`. As tabelas fonema → visema são dados, um objeto por idioma, então acrescentar um idioma não exige mudar código.
  - **`class SequenciaDeVisemas`:** `texto(): string` e `espalharSobre(quadrosComVoz: readonly boolean[]): string`, que devolve um caractere por quadro, com `X` onde não há voz.
  - **Porta `interface Fonetizador`:** `ipa(texto: string, idioma: Idioma): Promise<string>`
  - **`FonetizadorEspeak implements Fonetizador`:** carrega o espeak uma vez e troca de voz pelo idioma.

A normalização do pt-BR (`æ→ɐ`, `y→ɪ` e as africadas) é copiada de `motor/scripts/tts.ts`, em `normalizePhonemes` e na tabela `VISEME`. O inglês usa a mesma tabela de vogais mais `[ʌæ]→A`, `[ɜɚ]→E`, `[θð]→C` e `[w]→U`.

- [ ] **Step 1: Write the failing tests**

```ts
test('pt-BR: "mapa" (ˈmapɐ) vira MAMA', () => assert.equal(MapaDeVisemas.para(Idioma.PORTUGUES).converter('ˈmapɐ').texto(), 'MAMA'));
test('en: "mama" (mˈɑːmə) vira MAME', () => assert.equal(MapaDeVisemas.para(Idioma.INGLES).converter('mˈɑːmə').texto(), 'MAME'));
test('espalha 3 visemas sobre 6 quadros com voz e mantém X no silêncio', () => {
  assert.equal(seq('AEI').espalharSobre([false, true, true, true, true, true, true, false]), 'XAAEEIIX');
});
test('espeak fonetiza pt-BR e en (integração)', async () => {
  const f = new FonetizadorEspeak();
  assert.match(await f.ipa('olá mundo', Idioma.PORTUGUES), /ol/);
  assert.match(await f.ipa('hello world', Idioma.INGLES), /h/);
});
test('palavra inglesa no meio de fala pt-BR não quebra', async () => {
  const ipa = await new FonetizadorEspeak().ipa('fiz o deploy ontem', Idioma.PORTUGUES);
  assert.ok(MapaDeVisemas.para(Idioma.PORTUGUES).converter(ipa).texto().length > 8);
});
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the viseme map and the espeak adapter.**
- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: visemas por idioma (pt-BR, en) com espeak"`

### Task 5: Vozes — porta, adaptadores Qwen e arquivo, e o caso de uso GerarVozes com cache

**Files:**
- Create: `nucleo/src/dominio/fala/Audio.ts` (`class Audio`: amostras + taxa), `nucleo/src/dominio/fala/Envelope.ts`
- Create: `nucleo/src/aplicacao/portas/ProvedorVoz.ts`, `nucleo/src/aplicacao/portas/ArmazemDeVozes.ts`
- Create: `nucleo/src/aplicacao/casos-de-uso/GerarVozes.ts`
- Create: `nucleo/src/infraestrutura/voz/VozQwen.ts`, `VozDeArquivo.ts`, `wav.ts`, `nucleo/src/infraestrutura/disco/ArmazemDeVozesEmDisco.ts`
- Test: `nucleo/test/dominio/fala/Envelope.test.ts`, `nucleo/test/aplicacao/GerarVozes.test.ts`, `nucleo/test/infraestrutura/voz/wav.test.ts`

**Interfaces:**
- Consumes: `Projeto`, `Fala`, `Idioma`, `Fonetizador`, `MapaDeVisemas`, `Fps`.
- Produces:
  - **`class Audio`:** `static de(amostras: Float32Array, taxa: number)`, `duracao(): Segundos` e `aparado(): Audio` (corta o silêncio das pontas e mantém 0,04 s, como em `trimSilence` no motor)
  - **`class Envelope`:** `static medir(audio: Audio, fps: Fps): Envelope`, `quadrosComVoz(): boolean[]`, `abertura(q: Quadro): number` (de 0 a 1) e `paraJson(): number[]`
  - **Porta `interface ProvedorVoz`:** `gerar(pedido: PedidoDeVoz): Promise<Audio>`, com `PedidoDeVoz = { texto: string; voz: string; idioma: Idioma; estilo?: string }`
  - **Porta `interface ArmazemDeVozes`:** `hashGravado(idFala: string): string | undefined`, `gravar(idFala: string, registro: VozGravada): Promise<void>` e `ler(idFala: string): Promise<VozGravada>`
  - **`type VozGravada`:** `{ arquivo: string; hash: string; duracaoSegundos: number; envelope: number[]; visemas: string; palavras?: PalavraJson[] }`. Os arquivos ficam em `voz/<id>.wav` e `voz/<id>.json`.
  - **`class GerarVozes`:** `constructor(dependencias: { voz: ProvedorVoz; fonetizador: Fonetizador; armazem: ArmazemDeVozes })` e `executar(projeto: Projeto, aoProgredir?: (p: Progresso) => void): Promise<RelatorioDeVozes>`. O hash é sha1 de `texto|pronuncia|voz|estilo|idioma|provedor`, e falas com o hash igual são puladas.
  - **`VozQwen implements ProvedorVoz`:** **reusa temporariamente** `Qwen3TTS` de `../../../../motor/scripts/qwen3-tts.ts` por import relativo. O comentário `// temporário até a fase Migração` é obrigatório. O idioma vira `'portuguese'` ou `'english'`.
  - **`VozDeArquivo implements ProvedorVoz`:** lê `gravacoes/<idFala>.wav` do projeto. É o caminho "gravei minha voz", e um arquivo ausente gera um erro com o caminho esperado.

- [ ] **Step 1: Write the failing tests**

```ts
test('fala com hash igual não é gerada de novo', async () => {
  const voz = new VozFalsa(); const caso = new GerarVozes({ voz, fonetizador: new FonetizadorFalso(), armazem: new ArmazemEmMemoria() });
  await caso.executar(projetoDeDuasFalas); await caso.executar(projetoDeDuasFalas);
  assert.equal(voz.chamadas, 2);
});
test('mudar o texto de uma fala regrava só ela', async () => { /* … */ assert.equal(voz.chamadas, 3); });
test('o registro tem um visema por quadro e X no silêncio', async () => {
  const registro = await armazem.ler('1');
  assert.equal(registro.visemas.length, Math.ceil(registro.duracaoSegundos * 30));
  assert.equal(registro.visemas[0], 'X');
});
test('wav escreve e lê de volta a mesma duração', () => { /* toWav → fromWav, 24000 Hz, 1 canal, 16 bits */ });
test('VozDeArquivo sem a gravação diz onde ela deveria estar', async () => {
  await assert.rejects(new VozDeArquivo(pasta).gerar(pedido('7')), /gravacoes\/7\.wav/);
});
```

`VozFalsa`, `FonetizadorFalso` e `ArmazemEmMemoria` ficam em `nucleo/test/dublês/`.

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the voice port, the two adapters, the store and GerarVozes**

A normalização de volume e o envelope vêm de `rmsFrames`/`envelope` do motor, refeitos como métodos de `Envelope`.

- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Run one real voice (manual)**

Rode `node src/apresentacao/cli/giz.ts voz test/fixtures/projeto-minimo` (a CLI mínima nasce aqui, com o subcomando `voz`). O Qwen está no cache em `~/.cache/giz`, então o comando deve gerar 2 WAVs que soam corretos.

- [ ] **Step 6: Commit** — `git commit -m "nucleo: geração de vozes com cache (Qwen local e gravação própria)"`

### Task 6: Tempo de cada palavra (alinhamento)

**Files:**
- Create: `nucleo/src/dominio/fala/Palavras.ts` (`Palavra`, `class Palavras`), `nucleo/src/dominio/fala/Reconciliacao.ts`
- Create: `nucleo/src/aplicacao/portas/Alinhador.ts`
- Create: `nucleo/src/infraestrutura/alinhamento/AlinhadorWhisper.ts`, `AlinhadorPorEnvelope.ts`
- Modify: `nucleo/src/aplicacao/casos-de-uso/GerarVozes.ts` (grava `palavras` no registro)
- Test: `nucleo/test/dominio/fala/Reconciliacao.test.ts`, `nucleo/test/infraestrutura/alinhamento/AlinhadorPorEnvelope.test.ts`

**Interfaces:**
- Produces:
  - **`class Palavras`:** `static doTexto(texto: string): Palavras` (palavras do roteiro, com a pontuação junto), `comTempos(inicios: Segundos[], fins: Segundos[]): Palavras`, `ativaEm(t: Segundos): number` (índice) e `paraJson(): PalavraJson[]`, com `PalavraJson = { texto: string; inicio: number; fim: number }`
  - **`function reconciliar(roteiro: Palavras, ouvidas: PalavraJson[]): Palavras | null`:** emparelha por similaridade normalizada (sem acento, sem pontuação, em minúsculas) com alinhamento de sequência. Palavras do roteiro sem par ganham o tempo interpolado entre as vizinhas. Devolve `null` se menos de 60% das palavras emparelharem.
  - **Porta `interface Alinhador`:** `alinhar(audio: Audio, texto: string, idioma: Idioma): Promise<Palavras>`
  - **`AlinhadorWhisper`:** usa `onnx-community/whisper-small` com `return_timestamps: 'word'` e `language` pelo idioma. Se `reconciliar` devolver `null`, delega a um `AlinhadorPorEnvelope` recebido no construtor.
  - **`AlinhadorPorEnvelope`:** espalha as palavras pelos quadros com voz, proporcional ao número de letras (a lógica de `charToFrame` do motor).

- [ ] **Step 1: Write the failing tests**

```ts
test('reconcilia quando o Whisper junta duas palavras', () => {
  const r = reconciliar(Palavras.doTexto('fiz o pull request ontem'),
    [w('fiz',0,.2), w('o',.2,.3), w('pullrequest',.3,.9), w('ontem',.9,1.3)])!;
  assert.deepEqual(r.paraJson().map((p) => p.texto), ['fiz', 'o', 'pull', 'request', 'ontem']);
  assertCrescente(r);
});
test('mantém o texto do roteiro, não o que foi ouvido', () => {
  const r = reconciliar(Palavras.doTexto('Olá, Téo!'), [w('ola',0,.3), w('teu',.3,.6)])!;
  assert.deepEqual(r.paraJson().map((p) => p.texto), ['Olá,', 'Téo!']);
});
test('alinhamento ruim demais devolve null', () => assert.equal(reconciliar(Palavras.doTexto('um dois três quatro cinco'), [w('banana',0,1)]), null));
test('por envelope: palavras em ordem e dentro da duração', () => { /* … */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the alignment and wire it into GerarVozes**

`GerarVozes` recebe um `alinhador: Alinhador` no objeto de dependências.

- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: tempo por palavra com Whisper e reserva por envelope"`

### Task 7: Câmera, piscada e estado do personagem (domínio puro)

**Files:**
- Create: `nucleo/src/dominio/camera/MovimentoDeCamera.ts`, `nucleo/src/dominio/camera/Enquadramento.ts`
- Create: `nucleo/src/dominio/personagem/Piscada.ts`, `nucleo/src/dominio/personagem/Corpo.ts`, `nucleo/src/dominio/personagem/EstadoDoPersonagem.ts`
- Test: `nucleo/test/dominio/camera/MovimentoDeCamera.test.ts`, `nucleo/test/dominio/personagem/*.test.ts`

**Interfaces:**
- Produces:
  - **`type MovimentoDeCameraJson`:** `{ tipo: 'parada'|'aproximar'|'afastar'|'deslizar'|'seguir'|'tremer', de?: {x,y,zoom}, para?: {x,y,zoom}, alvo?: string, intensidade?: number, suavidade?: 'linear'|'suave' }`
  - **`class MovimentoDeCamera`:** `static de(json)` e `enquadramentoEm(progresso: number /* de 0 a 1 */, quadro: Quadro): Enquadramento`. Cada tipo é uma classe que implementa `TipoDeMovimento`, e um registro mapeia o nome para a classe, sem `switch`.
  - **`class Enquadramento`:** `{ zoom, x, y, rotacao }`, mais `transformacaoCss(): string`. O zoom fica sempre ≥ 1 para nunca mostrar a borda do fundo, e `x`/`y` ficam limitados pela folga que esse zoom dá.
  - **`class Piscada`:** `static para(semente: string)` e `fechamentoEm(q: Quadro, fps: Fps): number` (de 0 a 1). Pisca a cada 2,5–5,5 s, num intervalo pseudoaleatório fixo pela semente, e cada piscada dura 4 quadros.
  - **`class Corpo`:** `deslocamentoEm(q: Quadro, contexto: ContextoDoCorpo): { y: number; rotacao: number; escala: number }`. Reproduz a regra contida de `motor/src/SpriteCharacter.tsx`: respiração de ±2 px, o volume puxa até 5 px, e o gesto da pose acontece uma vez (`sin` de 0 a π em 0,5–0,6 s).
  - **`class EstadoDoPersonagem`:** `pose`, `expressao`, `olhar`, `falando: boolean`, `visema: Visema`, `abertura: number`, `piscada: number` e `corpo`. É montado por `EstadoDoPersonagem.no(quadro, linhaDoTempoDoPersonagem)` no Task 9.

- [ ] **Step 1: Write the failing tests**

```ts
test('aproximar vai de zoom 1 a 1,3 e nunca abaixo de 1', () => {
  const m = MovimentoDeCamera.de({ tipo: 'aproximar', para: { x: 0, y: 0, zoom: 1.3 } });
  assert.equal(m.enquadramentoEm(0, Quadro.de(0)).zoom, 1);
  assert.equal(m.enquadramentoEm(1, Quadro.de(90)).zoom, 1.3);
});
test('deslizar nunca mostra a borda: x limitado pela folga do zoom', () => {
  const e = MovimentoDeCamera.de({ tipo: 'deslizar', de: { x: -1, y: 0, zoom: 1.1 }, para: { x: 1, y: 0, zoom: 1.1 } }).enquadramentoEm(1, Quadro.de(0));
  assert.ok(Math.abs(e.x) <= (1.1 - 1) / 2 + 1e-9);
});
test('tipo de câmera desconhecido lista os válidos', () => assert.throws(() => MovimentoDeCamera.de({ tipo: 'girar' } as never), /aproximar.*tremer/));
test('piscada é determinística e fecha por 4 quadros', () => { /* mesma semente → mesmos quadros fechados; 4 consecutivos > 0.5 */ });
test('gesto da pose acontece uma vez', () => { /* deslocamento 0 aos 2 s depois do início da pose */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the camera, blink, body and character state.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: câmera, piscada e corpo calculados no domínio"`

### Task 8: Área segura, caixas e verificação do projeto

**Files:**
- Create: `nucleo/src/dominio/layout/Caixa.ts`, `Caixas.ts`, `AreaSegura.ts`, `EncaixeDeTexto.ts`
- Create: `nucleo/src/aplicacao/casos-de-uso/VerificarProjeto.ts`
- Modify: `nucleo/src/apresentacao/cli/giz.ts` (subcomando `check`)
- Test: `nucleo/test/dominio/layout/*.test.ts`, `nucleo/test/aplicacao/VerificarProjeto.test.ts`

**Interfaces:**
- Produces:
  - **`class Caixa`:** `{ x, y, largura, altura }` em pixels do vídeo, mais `rotulo: string`, `sobrepoe(outra: Caixa): boolean` e `dentroDe(outra: Caixa): boolean`
  - **`class Caixas`:** coleção com `sobreposicoes(): Array<[Caixa, Caixa]>` e `foraDe(area: Caixa): Caixa[]`
  - **`class AreaSegura`:** `static para(proporcao: Proporcao): Caixa`. Em 16:9 deixa 5% de margem. Em 9:16 deixa 8% nas laterais, 13% em cima e 22% embaixo, por causa da interface do Reels e do Shorts.
  - **`class EncaixeDeTexto`:** portado de `motor/src/textFit.ts`. Tem `static medir(texto: string, fonte: Fonte, larguraMaxima: number): { linhas: string[]; tamanho: number; cabe: boolean }`, com a fonte encolhendo até 60% do tamanho base antes de desistir. A largura dos caracteres é estimada pela tabela que o motor já usa, sem depender do DOM.
  - **Contrato que toda cena cumpre (Tasks 12 e 13):** `caixasDaCena(cena: Cena, proporcao: Proporcao, idioma: Idioma): Caixas`, registrado no `RegistroDeLayouts` (`src/dominio/layout/RegistroDeLayouts.ts`, com `registrar(tipo, funcao)` e `caixasDe(cena, proporcao, idioma)`).
  - **`class VerificarProjeto`:** `executar(projeto: Projeto): RelatorioDeVerificacao`, com `{ erros: Problema[]; avisos: Problema[] }` e `Problema = { fala: string; mensagem: string }`. Um texto que não cabe, uma sobreposição ou algo fora da área segura é **erro**. Uma imagem ausente é **aviso**.
  - **CLI:** `giz check <pasta>` sai com código 1 se houver erros e imprime uma linha por problema.

- [ ] **Step 1: Write the failing tests**

```ts
test('área segura 9:16 respeita a interface do Reels', () => {
  const a = AreaSegura.para(Proporcao.de('9:16'));
  assert.deepEqual([a.x, a.y, a.largura, a.altura], [86, 250, 908, 1248]);
});
test('fala de 300 caracteres na legenda 9:16 encolhe e cabe', () => assert.ok(EncaixeDeTexto.medir('x '.repeat(150), FONTE_LEGENDA, 908).cabe));
test('título de 80 caracteres sem espaço não cabe e vira erro no check', () => {
  const r = new VerificarProjeto().executar(projetoComTitulo('A'.repeat(80), '9:16'));
  assert.match(r.erros[0].mensagem, /título não cabe/);
});
test('código de 20 linhas em 9:16 cabe ou acusa erro, nunca passa calado', () => { /* … */ });
test('duas caixas sobrepostas são acusadas com os rótulos', () => { /* … */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the layout, the text fitting, VerificarProjeto and the `check` CLI.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: área segura por proporção e verificação de sobreposição"`

### Task 9: Linha do tempo (o que o Remotion recebe)

**Files:**
- Create: `nucleo/src/dominio/linha-do-tempo/LinhaDoTempo.ts`, `TrechoDeFala.ts`, `Marcas.ts`, `PropsDoVideo.ts` (tipos serializáveis)
- Create: `nucleo/src/aplicacao/casos-de-uso/MontarLinhaDoTempo.ts`
- Test: `nucleo/test/aplicacao/MontarLinhaDoTempo.test.ts`

**Interfaces:**
- Consumes: `Projeto`, `ArmazemDeVozes.ler`, `Palavras`, `Envelope`, `EstadoDoPersonagem`.
- Produces:
  - **`type PropsDoVideo`:** só JSON, para passar ao Remotion. Tem `{ fps, largura, altura, idioma, formato, estiloDeLegenda, marca?, titulo, capitulos, totalDeQuadros, trechos: TrechoJson[], elenco: PersonagemJson[], efeitosSonoros: {quadro,som}[] }`.
  - **`TrechoJson`:** `{ idFala, quem, inicio, duracaoDaFala, duracaoTotal, cena: CenaResolvida, chaveDaCena, palavras: {texto,inicio,fim}[] /* em quadros relativos */, marcas: {quadro, mudancas}[], estados: Record<idPersonagem, {pose,expressao,olhar}>, audio?: string, envelope?: number[], visemas?: string, pausaDepois? }`
  - **`class MontarLinhaDoTempo`:** `constructor({ armazem })` e `executar(projeto): Promise<PropsDoVideo>`. Repete as regras do `build` do motor: a cena ausente herda a anterior; as marcas `[trecho]` caem no tempo da palavra que abre o trecho (agora pelo tempo real da palavra); há uma pausa de leitura quando abre um código novo; há 0,35 s de respiro entre as falas.
  - **`class LinhaDoTempo`:** `estadoDe(idPersonagem, quadro): EstadoDoPersonagem`, usada pela apresentação por quadro.

- [ ] **Step 1: Write the failing tests**

```ts
test('fala sem cena herda a cena anterior', async () => { /* trechos[1].cena === trechos[0].cena; mesma chaveDaCena */ });
test('marca do segundo [trecho] cai no quadro da palavra que o abre', async () => {
  // texto 'Um cliente [usou um cupom] e [pagou mais].' com palavras alinhadas → marcas[1].quadro == inicio de "pagou"
});
test('total de quadros = soma das durações', async () => { /* … */ });
test('narrador fala sem estado de corpo', async () => { /* estados não contém 'narrador' */ });
test('falta de áudio lista as falas pendentes', async () => { await assert.rejects(caso.executar(semAudio), /falas sem áudio: 2, 3/); });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement MontarLinhaDoTempo and LinhaDoTempo.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: linha do tempo com marcas no tempo real das palavras"`

### Task 10: Rig de personagem — interface, registro e modelo "cabeça-bola"

**Files:**
- Create: `nucleo/src/apresentacao/rigs/ModeloDeRig.ts`, `registroDeRigs.ts`
- Create: `nucleo/src/apresentacao/rigs/cabeca-bola/` (`CabecaBola.tsx`, `Rosto.tsx`, `Olhos.tsx`, `Sobrancelhas.tsx`, `Boca.tsx`, `Bracos.tsx`, `Roupa.tsx`, `parametros.ts`)
- Create: `nucleo/src/dominio/personagem/GeometriaDaBoca.ts`, `GeometriaDosBracos.ts`, `GeometriaDoRosto.ts` (os números de cada visema, expressão e pose ficam no domínio e são testados)
- Create: `nucleo/src/apresentacao/remotion/FichaDoPersonagem.tsx`
- Test: `nucleo/test/dominio/personagem/Geometria*.test.ts`

**Interfaces:**
- Produces:
  - **`interface ModeloDeRig`:** `{ id: string; nome: { 'pt-BR': string; en: string }; parametros: DefinicaoDeParametros; Componente: React.FC<PropsDoRig> }`
  - **`type PropsDoRig`:** `{ estado: EstadoDoPersonagem; parametros: ParametrosValidados; altura: number; lado: -1 | 1 }`
  - **`DefinicaoDeParametros`:** `Record<string, { tipo: 'cor'|'numero'|'opcao'|'booleano'; padrao; min?; max?; opcoes?: string[] }>`. A validação de `elenco/*.json` (Task 3) passa a usar esta definição: o repositório recebe o `registroDeRigs` pela composição.
  - **`registroDeRigs`:** `registrar(modelo)`, `obter(id)` (que dá erro listando os ids válidos) e `todos()`.
  - **Parâmetros do cabeça-bola:** `corDaCabeca` (padrão `#151515`), `brilho` (booleano), `corDaRoupa`, `roupa: 'camiseta'|'tunica'|'vestido'|'moletom'`, `cabelo: 'nenhum'|'coque'|'curto'|'lenco'|'chapeu'`, `corDoAcessorio`, `oculos` (booleano), `escalaDosOlhos` (de 0,8 a 1,4).
  - **Visual:** cabeça redonda escura com olhos brancos grandes, pupila que segue o `olhar`, sobrancelhas que dão a expressão, boca por visema × abertura, piscada, braços com mãos nas 10 poses, e o corpo seguindo `Corpo` (Task 7).
  - **`FichaDoPersonagem`:** composição Remotion `Ficha` (1920×1080, 1 quadro), com o personagem em todas as expressões e poses e os 9 visemas.

- [ ] **Step 1: Write the failing tests**

```ts
test('visema M fecha a boca; A abre proporcional à abertura', () => {
  assert.equal(GeometriaDaBoca.para('M', 1).altura, 0);
  assert.ok(GeometriaDaBoca.para('A', 1).altura > GeometriaDaBoca.para('A', 0.3).altura);
});
test('expressão brava baixa as sobrancelhas para o centro', () => { /* ângulo interno > 0 */ });
test('as 10 poses têm geometria definida', () => { for (const p of POSES) assert.ok(GeometriaDosBracos.para(p)); });
test('registro recusa rig desconhecido listando os válidos', () => assert.throws(() => registroDeRigs.obter('robo'), /cabeca-bola/));
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the geometry in the domain and the SVG components in the presentation.**
- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Render the sheet and look at it**

Run: `npx remotion still src/apresentacao/remotion/index.ts Ficha saida/ficha-cabeca-bola.png --props='{"rig":"cabeca-bola"}'`
Expected: um PNG sem nada cortado, com cada expressão claramente distinguível e a boca diferente em cada visema. Mande-o ao Anderson com SendUserFile.

- [ ] **Step 6: Commit** — `git commit -m "nucleo: rig cabeça-bola por partes, com registro de modelos"`

### Task 11: Rig "estilo-lia" e o elenco de exemplo

**Files:**
- Create: `nucleo/src/apresentacao/rigs/estilo-lia/` (porta de `motor/src/Character.tsx`, quebrada em partes como no Task 10, com `Hair`/`emblem` virando parâmetros)
- Create: `nucleo/src/dominio/personagem/GeometriaEstiloLia.ts`
- Create: `personagens/elencos/exemplo/lia.json`, `personagens/elencos/exemplo/teo.json` (na raiz do repo, fora de `nucleo/`)
- Test: `nucleo/test/dominio/personagem/GeometriaEstiloLia.test.ts`

**Interfaces:**
- Consumes: `ModeloDeRig`, `PropsDoRig`, `registroDeRigs` (Task 10).
- Produces:
  - **Parâmetros do estilo-lia:** `pele`, `corDoCabelo`, `corDoCabelo2`, `cabelo: 'longo'|'curto'|'raspado'|'coque'`, `corDoMoletom`, `sombraDoMoletom`, `emblema: 'estrela'|'codigo'|'nenhum'`, `oculos` (booleano), `corDosOculos`, `larguraDaSobrancelha` (5–12), `arcoDaSobrancelha` (0–9), `sorriso` (18–34)
  - **`lia.json` e `teo.json`:** os valores de `motor/src/cast.ts` (moletom `#8B3FF5`/`#6A22D6` com estrela; `#4F35D9`/`#3A22B0` com código; sobrancelhas 7/7 e 10/2; sorrisos 30 e 24), com as vozes Qwen padrão `vivian`/`dylan`

- [ ] **Step 1: Write the failing test**

`as poses do estilo-lia têm os ângulos do motor`: compara com `POSES` de `motor/src/Character.tsx`, copiados para o teste como valores literais, mapeados `neutral→neutra`, `explain→explicar` etc. As poses novas (`mao-na-cabeca`, `maos-na-boca`) têm geometria definida.

- [ ] **Step 2: Run the test and confirm it fails** — FAIL.
- [ ] **Step 3: Implement the estilo-lia rig and the two cast files.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Render the sheet**

Rode `Ficha` com `--props='{"rig":"estilo-lia","personagem":"../personagens/elencos/exemplo/lia.json"}'` e faça o mesmo para o Téo. Confira o resultado lado a lado com `personagens/ficha-lia-teo.png`.

- [ ] **Step 6: Commit** — `git commit -m "nucleo: rig estilo-lia e elenco de exemplo Lia/Téo"`

### Task 12: Cena "cenário" — fundo, câmera, personagens, efeitos e HUD

**Files:**
- Create: `nucleo/src/apresentacao/cenas/registroDeCenas.ts` (`registrar(tipo, { Componente, caixas })`)
- Create: `nucleo/src/apresentacao/cenas/cenario/` (`CenaCenario.tsx`, `Fundo.tsx`, `PersonagensNaCena.tsx`, `Hud.tsx`, `TextoGrande.tsx`)
- Create: `nucleo/src/apresentacao/cenas/cenario/fundos/` (`registroDeFundos.ts` e os fundos vetoriais `sala.tsx`, `rua.tsx`, `campo.tsx`, `ceu-noturno.tsx`, `laboratorio.tsx`, `aldeia.tsx`), cada um em camadas (fundo, meio, frente) e com cores parametrizáveis
- Create: `nucleo/src/apresentacao/cenas/cenario/efeitos/` (`registroDeEfeitos.ts`, `Vinheta.tsx`, `Brilho.tsx`, `Particulas.tsx`, `Fogo.tsx`, `Chuva.tsx`, `Neve.tsx`, `Tonalidade.tsx`)
- Create: `nucleo/src/dominio/cenario/Posicionamento.ts` (onde fica cada personagem por proporção), `nucleo/src/dominio/cenario/Particulas.ts` (posições determinísticas por quadro), `nucleo/src/dominio/cenario/Paralaxe.ts`
- Create: `nucleo/src/dominio/layout/layoutDoCenario.ts` (registra as caixas da cena `cenario`)
- Test: `nucleo/test/dominio/cenario/*.test.ts`

**Interfaces:**
- Consumes: `MovimentoDeCamera`, `Enquadramento`, `LinhaDoTempo.estadoDe`, `registroDeRigs`, `RegistroDeLayouts`.
- Produces:
  - **`Hud`:** `{ campos: Array<{ rotulo: string; valor: string }>, barra?: { rotulo: string; valor: number /* 0–100 */ } }`, desenhado no canto superior esquerdo e dentro da área segura
  - **`Efeito`:** `{ tipo: 'vinheta'|'brilho'|'particulas'|'fogo'|'chuva'|'neve'|'tonalidade', intensidade?: number, cor?: string, posicao?: {x,y} }`
  - **`TextoGrande`:** `{ texto: string; cor?: string; entrada?: 'pop'|'subir' }`, encaixado por `EncaixeDeTexto`
  - **`Posicionamento.para(personagens, proporcao): Array<{ x, y, altura, lado }>`**: em 16:9, até 3 lado a lado; em 9:16, até 2, com o segundo menor e atrás
  - **`Paralaxe.deslocamento(camada: 0|1|2, enquadramento): {x,y}`**: as camadas do fundo se movem a 0,3, 0,6 e 1,0 do movimento da câmera
  - Um fundo de **imagem** (`fundo.imagem`) é desenhado com `object-fit: cover` e 12% de folga para a câmera. Uma imagem ausente cai no fundo vetorial `sala` (o aviso já vem do Task 3).

- [ ] **Step 1: Write the failing tests**

```ts
test('em 9:16 dois personagens cabem na área segura', () => { /* caixas dentro de AreaSegura */ });
test('três personagens em 9:16 viram erro de layout legível', () => { /* /no máximo 2 personagens em 9:16/ */ });
test('paralaxe: camada do fundo move menos que a da frente', () => { /* |x0| < |x2| */ });
test('partículas são determinísticas por quadro', () => { /* mesmo quadro → mesmas posições */ });
test('HUD dentro da área segura nas duas proporções', () => { /* … */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the scene, the backgrounds, the effects and the HUD**

A cena, os fundos, os efeitos e o HUD entram nos registros. Não há `switch` por tipo.

- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Render three stills of a test scene**

O teste usa o fundo `aldeia`, fogo, vinheta, HUD e dois personagens cabeça-bola, e é renderizado em 9:16 e 16:9 nos quadros 0, 45 e 90. Mande os stills ao Anderson.

- [ ] **Step 6: Commit** — `git commit -m "nucleo: cena cenário com câmera, paralaxe, efeitos e HUD"`

### Task 13: Cenas de aula migradas e responsivas

**Files:**
- Create: `nucleo/src/apresentacao/cenas/aula/` (`Titulo.tsx`, `Cartao.tsx`, `Citacao.tsx`, `Grafico.tsx`, `Sintomas.tsx`, `Codigo.tsx`, `Terminal.tsx`, `Grafo.tsx`, `Versus.tsx`, `Tabela.tsx`, `Conversa.tsx`, `Painel.tsx`, `realceDeCodigo.ts`)
- Create: `nucleo/src/dominio/layout/layoutsDeAula.ts` (as caixas de cada cena de aula por proporção), `nucleo/src/dominio/layout/LayoutDeGrafo.ts` (porta de `motor/src/graphLayout.ts`), `nucleo/src/dominio/codigo/Tokens.ts` (porta de `tokenize` do motor, com palavras-chave por linguagem)
- Create: `nucleo/src/dominio/aula/ApresentadoresNaAula.ts` (onde ficam os apresentadores: em 16:9 nas laterais, como no motor; em 9:16 embaixo, com o conteúdo em cima)
- Test: `nucleo/test/dominio/layout/layoutsDeAula.test.ts`, `nucleo/test/dominio/codigo/Tokens.test.ts`, `nucleo/test/dominio/layout/LayoutDeGrafo.test.ts`

**Interfaces:**
- Consumes: `registroDeCenas`, `RegistroDeLayouts`, `EncaixeDeTexto`, `registroDeRigs`.
- Produces: cada cena de aula é registrada com `{ Componente, caixas }`. A cena `codigo` lê `linhas` embutidas, marca `adicionadas` em verde e realça `destaque`. Os rótulos fixos ("Objetivo", "Resumo", "Desafio", "Ache o bug"…) vêm de `textosFixos(idioma)` (Task 14).
- O visual segue `motor/src/scenes.tsx` (cores de `motor/src/theme.ts`), mas cada componente fica em seu próprio arquivo e a conta vai para o domínio.

- [ ] **Step 1: Write the failing tests**

```ts
test('tokens: palavras-chave de TypeScript realçadas', () => { /* 'export const x' → [kw, sp, kw, sp, id] */ });
test('grafo de 8 nós sem sobreposição em 9:16', () => { /* LayoutDeGrafo.posicionar(...) → Caixas.sobreposicoes() vazio */ });
test('cada cena de aula tem layout nas duas proporções', () => { for (const t of TIPOS_DE_AULA) for (const p of PROPORCOES) assert.ok(caixasDe(exemplo(t), p)); });
test('tabela de 6 colunas em 9:16 encolhe ou acusa erro', () => { /* … */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the lesson scenes, their layouts, the tokenizer and the graph layout.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Render a still of every lesson scene in 9:16 and 16:9**

Use a composição `CatalogoDeCenas`, criada aqui, e confira o resultado ao lado de um quadro de uma aula do SOLID.

- [ ] **Step 6: Commit** — `git commit -m "nucleo: cenas de aula responsivas (9:16 e 16:9) com código embutido"`

### Task 14: Legendas (palavra a palavra e em blocos) e textos fixos por idioma

**Files:**
- Create: `nucleo/src/dominio/legenda/LegendaPorPalavras.ts`, `LegendaEmBlocos.ts` (porta de `motor/src/captions.ts`)
- Create: `nucleo/src/dominio/i18n/textosFixos.ts`, `nucleo/src/dominio/i18n/pt-BR.ts`, `nucleo/src/dominio/i18n/en.ts`
- Create: `nucleo/src/apresentacao/legendas/LegendaPalavras.tsx`, `LegendaBlocos.tsx`, `registroDeLegendas.ts`
- Create: `nucleo/src/infraestrutura/disco/escreverSrt.ts`
- Test: `nucleo/test/dominio/legenda/*.test.ts`, `nucleo/test/dominio/i18n/textosFixos.test.ts`, `nucleo/test/infraestrutura/disco/escreverSrt.test.ts`

**Interfaces:**
- Produces:
  - **`class LegendaPorPalavras`:** `static de(palavras: Palavras, largura: number)` e `grupoEm(q: Quadro): { palavras: string[]; ativa: number }`. Mostra grupos de no máximo 3 palavras, que trocam quando o grupo termina, com a palavra falada em destaque, no estilo das referências. O grupo inteiro precisa caber numa linha da área segura.
  - **`class LegendaEmBlocos`:** `blocosDe(texto: string, maximo: number): Array<{ texto: string; inicio: number }>`, como em `captionChunks`
  - **`textosFixos(idioma: Idioma): TextosFixos`:** um objeto com chaves tipadas (`objetivo`, `resumo`, `desafio`, `proximaAula`, `acheOBug`, `regra`, `ticket`, `capitulo`, `segundos`), e os dois idiomas precisam ter exatamente as mesmas chaves
  - **`escreverSrt(props: PropsDoVideo): string`:** com o tempo real das palavras

- [ ] **Step 1: Write the failing tests**

```ts
test('grupo de até 3 palavras com a ativa certa', () => {
  const l = LegendaPorPalavras.de(palavras('Você nasceu em mil trezentos e quarenta', 0.3), 908);
  assert.deepEqual(l.grupoEm(Quadro.de(10)), { palavras: ['Você', 'nasceu', 'em'], ativa: 1 });
});
test('palavra enorme sozinha ainda cabe (encolhe)', () => { /* … */ });
test('pt-BR e en têm as mesmas chaves', () => assert.deepEqual(Object.keys(textosFixos(Idioma.PORTUGUES)).sort(), Object.keys(textosFixos(Idioma.INGLES)).sort()));
test('srt usa os tempos das palavras', () => { /* 00:00:01,200 --> … */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the captions, the fixed texts and the SRT writer.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Commit** — `git commit -m "nucleo: legenda palavra a palavra, blocos e textos fixos pt-BR/en"`

### Task 15: Composição do vídeo, renderizador e CLI completa

**Files:**
- Create: `nucleo/src/apresentacao/remotion/index.ts`, `Raiz.tsx`, `Video.tsx`, `Trecho.tsx`, `Moldura.tsx` (marca, capítulo), `Sons.tsx`
- Create: `nucleo/src/aplicacao/portas/Renderizador.ts`, `nucleo/src/aplicacao/casos-de-uso/ProduzirVideo.ts`
- Create: `nucleo/src/infraestrutura/render/RenderizadorRemotion.ts`
- Create: `nucleo/src/apresentacao/cli/composicao.ts`; modify `nucleo/src/apresentacao/cli/giz.ts`
- Copy: `motor/public/sfx/*` → `nucleo/public/sons/` (os mesmos arquivos)
- Test: `nucleo/test/aplicacao/ProduzirVideo.test.ts`

**Interfaces:**
- Consumes: todos os casos de uso e registros anteriores.
- Produces:
  - **Composições:** `Video` (dimensões dadas por `calculateMetadata` a partir de `PropsDoVideo.largura/altura`), `Ficha` e `CatalogoDeCenas`
  - **Porta `interface Renderizador`:** `renderizar(props: PropsDoVideo, saida: string, aoProgredir: (fracao: number) => void): Promise<void>`
  - **`RenderizadorRemotion`:** usa `bundle()` + `selectComposition()` + `renderMedia()` de `@remotion/renderer`, chamados direto em vez de por `npx`, que é o que o Electron vai usar. O codec é h264. O áudio de cada fala é servido por `publicDir` apontando para o projeto.
  - **`class ProduzirVideo`:** `constructor({ repositorio, gerarVozes, montar, verificar, renderizador })` e `executar(pasta): Promise<{ video: string; legendas: string }>`. Ele carrega, verifica (para se houver erro), gera as vozes, monta, renderiza e escreve em `saida/video.mp4` e `saida/legendas.srt`.
  - **CLI `giz`:** `voz <pasta>`, `check <pasta>`, `montar <pasta>`, `render <pasta>`, `produzir <pasta>` e `ficha <rig> [personagem.json]`, com mensagens no idioma do projeto. `composicao.ts` é o único lugar com `new` dos adaptadores.

- [ ] **Step 1: Write the failing test**

```ts
test('produzir para no check com erro e não renderiza', async () => {
  const r = new RenderizadorFalso();
  await assert.rejects(new ProduzirVideo(dependencias({ renderizador: r, verificacao: comErro })).executar('x'), /título não cabe/);
  assert.equal(r.chamadas, 0);
});
test('produzir chama as etapas em ordem', async () => { /* ordem: carregar, verificar, vozes, montar, renderizar */ });
```

- [ ] **Step 2: Run the tests and confirm they fail** — FAIL.
- [ ] **Step 3: Implement the compositions, the renderer, ProduzirVideo and the CLI.**
- [ ] **Step 4: Run all the checks** — PASS.
- [ ] **Step 5: Produce the test fixture end to end**

Run: `node src/apresentacao/cli/giz.ts produzir test/fixtures/projeto-minimo`
Expected: `saida/video.mp4` com a voz, a boca sincronizada e a legenda palavra a palavra, e `saida/legendas.srt`.

- [ ] **Step 6: Commit** — `git commit -m "nucleo: composição, renderizador e CLI giz produzir"`

### Task 16: Projetos de exemplo e o portão do Anderson

**Files:**
- Create: `nucleo/exemplos/historia-internet/pt-BR/` e `nucleo/exemplos/historia-internet/en/`. Cada pasta tem `projeto.json` (formato `historia`, 9:16, legenda `palavras`), `roteiro.json` e `elenco/`. O tema é original: **"E se a internet parasse por 24 horas?"**, uns 60 s, com narrador e dois personagens cabeça-bola que falam. Usa pelo menos 4 fundos vetoriais diferentes, 4 movimentos de câmera, fogo ou chuva, HUD (`HORA 3 · SEM SINAL · pânico 40%`) e texto grande.
- Create: `nucleo/exemplos/aula-cupom/pt-BR/` e `nucleo/exemplos/aula-cupom/en/`. São a aula do cupom de `_template/aula/roteiro.ts` convertida para v2: formato `aula`, 16:9, legenda `blocos`, elenco Lia/Téo de `personagens/elencos/exemplo`, código embutido.
- Create: `nucleo/README.md` (como criar um projeto, cada campo do roteiro v2, rigs e parâmetros, cenas, efeitos e câmera, com um exemplo por item)
- Create: `nucleo/test/exemplos.test.ts`

**Interfaces:**
- Consumes: CLI `giz produzir` (Task 15).

- [ ] **Step 1: Write the failing test**

`os 4 exemplos carregam e passam no check sem erros`: carrega cada pasta com `RepositorioDeProjetoEmDisco` e roda `VerificarProjeto`, esperando `erros.length === 0`.

- [ ] **Step 2: Run the test and confirm it fails** — FAIL, porque as pastas ainda não existem.
- [ ] **Step 3: Write the four examples and the README.**
- [ ] **Step 4: Run all the checks** — `npm run verificar`; PASS.
- [ ] **Step 5: Produce the four videos**

Run: `for d in exemplos/*/*/; do node src/apresentacao/cli/giz.ts produzir "$d"; done`
Expected: 4 MP4 + SRT. Confira cada um no início, no meio e no fim (com stills e ouvindo o áudio).

- [ ] **Step 6: Run the gate**

Mande os 4 vídeos ao Anderson com SendUserFile, junto com um quadro da referência `ytSjyQin8iY` ao lado de um quadro da história. Pergunte se a fase 2 segue com o rig vetorial ou se outro tipo de rig entra (seção "Portão da fase 1" do spec). **Não comece a fase 2 sem a resposta.**

- [ ] **Step 7: Commit** — `git commit -m "nucleo: exemplos história e aula em pt-BR e en"`
