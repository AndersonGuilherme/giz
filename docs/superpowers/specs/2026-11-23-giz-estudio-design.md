# giz Estúdio — design

Data: 2026-11-23 · Status: rascunho para aprovação do Anderson

## 1. Intenção e porquê

Hoje o giz é uma fábrica de videoaulas com dois personagens fixos (Lia e Téo), operada por linha de comando e
por quem sabe editar TypeScript. O Anderson quer que o repositório público vire uma ferramenta para **qualquer
pessoa** criar vídeos animados para **YouTube e Instagram** no nível visual das referências:

- "E se você nascesse em 1340…" (canal Imagina Só) — referência principal: personagens simples de cabeça-bola com
  olhos/sobrancelhas/boca expressivos, cenários ilustrados, câmera que aproxima e desliza, luz quente, legenda
  palavra a palavra, painel informativo (HUD) no canto.
- "I Made VIRAL Animation Videos Using Claude Code" (Grow With Kaz) e "Claude Made These Animated Videos"
  (AI Madame): mesmo gênero, cenários pintados, personagens estilizados.

Ele também quer continuar podendo fazer aulas no estilo que já fizemos, e criar **personagens próprios**, sem
elenco fixo.

Tudo pela tela: um **programa instalável** (Mac, Windows, Linux) onde a pessoa configura, cadastra as próprias
contas de IA, gera roteiro, personagens, cenários e áudio, revisa cada etapa e recebe o vídeo pronto.

## 2. Objetivos, não-objetivos, anti-objetivos

**Objetivos**
- Programa desktop instalável nos três sistemas, com configuração e instalação de dependências pela tela.
- Dois formatos de vídeo na primeira versão: **história narrada** (estilo das referências) e **aula** (estilo
  Lia/Téo, dois apresentadores + cenas de conteúdo: código, terminal, cartões, gráficos…).
- Elenco livre: a pessoa cria quantos personagens quiser, num editor visual.
- Contas de IA da própria pessoa (texto, imagem, voz). Com chave, resultado melhor; sem chave, ainda funciona.
- Fluxo **por etapas com revisão**: cada etapa pode ser editada e regenerada item a item, sem refazer o resto.
- Saída: MP4 + legendas (.srt) + capa, em **9:16 (Reels/Shorts)** ou **16:9 (YouTube)**.

**Não-objetivos (agora)**
- Mexer nas aulas já produzidas (SOLID, ia-software-de-verdade). Elas continuam renderizando pelo motor atual.
- Editor de linha do tempo quadro a quadro (estilo After Effects/Premiere).
- Personagens 3D, vídeo gerado por IA (Sora/Veo etc.), publicação automática em redes sociais pelo programa
  (o `youtube.ts` atual continua existindo para quem usa a linha de comando).
- Assinatura de código / notarização dos instaladores (fica para depois; ver riscos).

**Anti-objetivos (falharia mesmo "funcionando")**
- Personagem que muda de cara de uma cena para outra.
- Exigir conta paga para conseguir sair um vídeo.
- Gastar créditos da IA da pessoa sem ela saber: toda etapa paga mostra a estimativa antes de rodar, e nada que
  já foi gerado é gerado de novo se a entrada não mudou.
- Texto sobreposto/cortado na tela (lição 32 continua valendo: tudo passa por encaixe de texto e checagem).
- Marca "tchr" ou dados pessoais do Anderson no repositório público.

## 3. Restrições

- Tudo no giz roda em Node hoje: Remotion (vídeo, React), Qwen3-TTS via onnxruntime-node, Whisper via
  transformers.js, espeak-ng (emscripten) para fonemas/visemas.
- Remotion precisa de um Chrome headless e de binários do compositor fora do `app.asar`.
- Licença do Remotion: grátis para pessoa física e empresa de até 3 pessoas; acima disso, a empresa usuária
  precisa da licença paga. O programa precisa dizer isso claramente (tela inicial e README).
- Modelos locais são grandes (voz 0.6B ≈ 5,9 GB; 1.7B ≈ 13,4 GB; Whisper ≈ 250 MB): download opcional, pela tela,
  com escolha de pasta e espaço livre mostrado (como o `npm run setup` já faz).
- Chaves de API ficam só na máquina da pessoa, cifradas.

## 4. Abordagens consideradas

### 4.1 Base do programa — **escolhida: Electron** (decisão do Anderson)
| Opção | Prós | Contras |
|---|---|---|
| **Electron** | mesma linguagem do motor; Remotion tem suporte oficial e template (Forge + Vite; render no processo principal; bundle pré-gerado; `binariesDirectory` em `app.asar.unpacked`) | instalador grande (>200 MB) |
| Tauri (Rust) + Node empacotado | janela mais leve | ainda precisa levar Node + Chrome; duas linguagens; empacotamento difícil; ganho de tamanho pequeno perto dos modelos |
| Página local no navegador | mais simples | sem instalador; exige Node instalado; não cumpre "instalar e configurar pela tela" |

### 4.2 Personagens — **escolhida: desenhados em código, por partes** (proposta aceita na conversa)
| Opção | Prós | Contras |
|---|---|---|
| **Rig vetorial paramétrico (SVG em React)** | idêntico em todas as cenas; boca sincronizada com a fala; olhos piscam; expressões e poses por roteiro; funciona sem chave | visual menos "pintado" que uma ilustração |
| Personagem gerado por IA de imagem | visual rico | não mantém consistência entre cenas; sem boca/olhos animáveis; custo por cena |
| Sprites PNG (como Lia/Téo hoje) | bonito parado | sem fala nem expressão de verdade; cada personagem novo exige um pacote de desenhos |

A IA de imagem fica com **cenários e objetos**, onde inconsistência pequena não incomoda.

### 4.3 Fluxo — **escolhido: etapas com revisão** (decisão do Anderson)
"Tema e vem pronto" foi descartado: qualquer erro obriga a regenerar tudo e gasta créditos.

## 5. Design

### 5.1 Organização do repositório
```
motor/        motor atual, CONGELADO (só correções) enquanto a fila da ElevenLabs e a publicação dependem dele;
              depois é SUBSTITUÍDO pelo núcleo e apagado (fase "Migração", decisão do Anderson)
nucleo/       novo motor: tipos do projeto, cenas, rig de personagens, câmera, composições Remotion, render
provedores/   interfaces + adaptadores de IA (texto, imagem, voz) e voz local (Qwen, migrada do motor)
estudio/      programa Electron (Forge + Vite + React): telas, IPC, render no processo principal
formatos/     modelos de formato (historia, aula): estrutura, prompts, cenas permitidas, padrões visuais
personagens/  modelos de rig (cabeca-bola, estilo-lia…) e elencos de exemplo (Lia e Téo recriados no rig)
cursos/       conteúdo existente, intocado
```
Workspaces npm no mesmo repositório. O núcleo e os provedores também funcionam pela linha de comando
(`npx giz render <projeto>`), para quem prefere automatizar ou usar o Claude Code.

### 5.1.1 Arquitetura e regras de código (decisão do Anderson: SOLID + Object Calisthenics, código fácil de manter)
Cada pacote (`nucleo`, `provedores`, `estudio`) segue **camadas com dependência só para dentro** (portas e
adaptadores):
```
dominio/        regras puras: objetos de valor, entidades, serviços de domínio. Sem React, Node, rede ou disco.
aplicacao/      casos de uso (ex.: GerarVozes, MontarLinhaDoTempo, RenderizarVideo) e PORTAS (interfaces) que
                eles precisam: ProvedorVoz, ProvedorImagem, ProvedorTexto, RepositorioDeProjeto, Renderizador…
infraestrutura/ ADAPTADORES das portas: Qwen, ElevenLabs, Whisper, espeak, sistema de arquivos, Remotion.
apresentacao/   o que a pessoa vê: componentes Remotion (cenas, rigs, legendas), CLI, e (fase 3) telas Electron.
```
Regras (valem para todo código novo; checadas por ferramenta no `npm run lint`, que roda no CI):
- **SOLID**: uma responsabilidade por classe/módulo; novos provedores, cenas, rigs, efeitos e formatos entram
  **por registro** (aberto para extensão) sem editar `switch` central; adaptadores trocáveis pela interface da
  porta; interfaces pequenas por papel; casos de uso recebem as portas por construtor (injeção de dependência),
  montadas num único ponto de composição por programa (`composicao.ts`).
- **Object Calisthenics** (adaptado a TypeScript): um nível de indentação por função; sem `else` (retorno
  antecipado, polimorfismo, mapas); **primitivos de domínio embrulhados** em objetos de valor (`Idioma`,
  `Proporcao`, `Segundos`, `Quadro`, `IdPersonagem`, `CorHex`…); **coleções de primeira classe** (`Elenco`,
  `Falas`, `Palavras`); um ponto por linha (Lei de Deméter) no domínio e na aplicação; nomes sem abreviação;
  entidades pequenas (arquivo ≤ 150 linhas, função ≤ 20 linhas, ≤ 3 parâmetros — mais que isso vira objeto);
  no máximo dois campos de estado por classe de domínio; sem getters/setters "anêmicos": objetos expõem
  comportamento (`fala.duracaoEmQuadros(fps)`, não `fala.getAudio().getLength()`).
- **Componentes React** (apresentação): só desenham; não calculam regra. Toda conta (câmera, piscada, visema
  do quadro, layout) vem de funções/objetos do domínio, testados sem render. Componentes pequenos e compostos.
- **Ferramentas**: ESLint (`max-depth: 1`, `no-else-return` + regra própria contra `else`, `max-lines`,
  `max-lines-per-function`, `max-params: 3`, `complexity`, `id-length` mínimo), dependency-cruiser bloqueando
  importação contra o sentido das camadas, `tsc --strict`, testes com `node:test`.
- Exceções às regras ficam numa linha de comentário com o motivo (`// calisthenics-exceção: …`) e são raras.
- **Idioma do código: inglês** (decisão do Anderson, 2026-11-23): identificadores, arquivos, pastas, comentários,
  chaves dos JSON de projeto, subcomandos da CLI e mensagens de commit. Textos que a pessoa usuária vê (erros,
  saída da CLI, rótulos nas cenas) ficam em pt-BR/en pelo i18n.

### 5.2 Projeto (um vídeo)
Uma pasta por vídeo, escolhida pela pessoa (padrão: `~/giz/projetos/<nome>`):
```
projeto.json      formato, proporção (9:16|16:9), idioma, elenco, provedores escolhidos, estado de cada etapa
roteiro.json      roteiro v2 (abaixo); editável pela tela
elenco/*.json     personagens usados (cópia do personagem da biblioteca, para o projeto não mudar sozinho)
cenarios/         imagens geradas/enviadas + prompt.json de cada uma
voz/              áudio por fala + alinhamento (tempo por palavra) + visemas
saida/            video.mp4, legendas.srt, capa.png
cache.json        hash da entrada de cada artefato → evita regenerar e gastar crédito
```

### 5.3 Roteiro v2
Generaliza o `Lesson` atual:
- `speaker` vira **id de personagem** (string) ou `"narrador"` (voz sem corpo na tela).
- Mantém as três camadas por fala (`text` legenda, `say` voz, visual) e os `beats` por `[trecho]`.
- Nova cena **`cenario`**: imagem de fundo (ref. a `cenarios/`), personagens presentes (posição, escala, de
  frente/perfil, pose, expressão, para onde olham), **movimento de câmera** (aproximar, afastar, deslizar, seguir
  personagem, tremer), **luz/efeitos** (vinheta, brilho, partículas, fogo/chuva/neve, cor), **sobreposições**
  (HUD com campos e barras, ícones que surgem, texto grande).
- Cenas de conteúdo do formato aula (code, terminal, card, table, graph, versus, quote, chart…) migram para o
  núcleo como estão, com encaixe de texto (`textFit`, `graphLayout`).
- **Legenda palavra a palavra** (estilo referências) como opção de estilo por formato; a legenda em blocos atual
  continua para aulas.
- Layout responsivo à proporção: toda cena declara como se arranja em 9:16 e 16:9; `check` falha se algo
  sobrepõe ou sai da área segura das redes (zona da interface do Reels/Shorts).

Validação com schema (zod) — usada pelo editor, pelo `check` e para validar o que a IA de texto devolve.

### 5.4 Personagens (rig)
- **Modelo de rig** = componente React/SVG com partes nomeadas: cabeça, olhos (piscada automática, direção do
  olhar), sobrancelhas, boca (formas por visema: X M A E I O U F C, já usadas no motor), tronco, braços e mãos
  com poses (neutro, explicar, apontar, acenar, levantar, pensar, dar de ombros, comemorar, mão na cabeça, mãos
  na boca), acessórios.
- **Personagem** = JSON: modelo de rig + parâmetros (cores, formato da cabeça, cabelo/chapéu/lenço, roupa,
  acessórios, traço de sobrancelha) + voz (provedor + id) + personalidade (para a IA de texto) + expressão padrão.
- Modelos na v1: **cabeça-bola** (estilo das referências) e **estilo-lia** (recria Lia/Téo em rig vetorial,
  partindo do `motor/src/Character.tsx`, que já tem sobrancelha, sorriso e boca por fonema).
- **Editor de personagem** na tela: escolher modelo, mexer nos parâmetros, ver ao vivo falando uma frase de
  teste com a voz escolhida, testar expressões e poses.
- Movimento contido por padrão (lições 25–26): gesto forte uma vez quando a pose começa, respiração leve, quem
  escuta reage só com o corpo.

### 5.5 Cenários
- Prompt de cada cenário vem do roteiro (a IA de texto propõe; a pessoa edita) + **preset de estilo** do projeto
  (ex.: "ilustração 2D pintada, luz quente", "flat vetorial", "aquarela") para manter coerência entre cenas.
- Gerados na proporção do vídeo, com folga de borda para a câmera se mover.
- Sem chave de imagem: a pessoa **envia imagens** próprias, ou usa **cenários vetoriais embutidos** (biblioteca
  pequena desenhada em código: sala, rua, laboratório, céu… com cores parametrizáveis).
- Por item: gerar de novo, trocar prompt, enviar imagem, recortar enquadramento.

### 5.6 Provedores de IA
Interfaces `ProvedorTexto`, `ProvedorImagem`, `ProvedorVoz` com estimativa de custo por chamada.
Adaptadores da v1:
- Texto: Anthropic (Claude), OpenAI, Google (Gemini).
- Imagem: OpenAI, Google (Gemini), fal.ai (Flux).
- Voz: Qwen3-TTS local (existente), ElevenLabs e Fish Audio (existentes no `tts.ts`, com dicionário por serviço
  e pausas — lições 29–31).
A pessoa escolhe um provedor por tarefa na configuração e pode trocar por projeto. Chaves guardadas com
`safeStorage` do Electron; botão "testar chave". Sem chave de texto, o roteiro é escrito à mão no editor
(com o modelo do formato preenchido).

### 5.7 Etapas no programa
1. **Ideia**: formato, proporção, duração alvo, tema, público, tom, idioma.
2. **Roteiro**: a IA de texto gera o roteiro v2 seguindo o guia do formato (`formatos/<f>/guia.md`, derivado de
   `padrao/como-escrever-uma-aula.md` para aulas); a pessoa edita fala a fala; validação ao vivo.
3. **Elenco**: escolher personagens da biblioteca ou criar no editor; associar falas a personagens.
4. **Cenários**: grade com todos os cenários; gerar/regenerar/enviar item a item; custo estimado antes.
5. **Vozes**: lista de falas com play; regravar uma fala; checagem de pronúncia opcional (Whisper local).
6. **Prévia e vídeo**: prévia no Remotion Player; render final com barra de progresso; abrir pasta da saída.
Cada etapa mostra o que está desatualizado quando uma anterior muda (ex.: texto de uma fala mudou → só aquele
áudio fica pendente).

### 5.8 Configuração e instalação pela tela
Primeira execução: idioma da interface, pasta de projetos, detecção de GPU (lógica do `scripts/gpu.ts`),
download opcional dos modelos locais com progresso, cadastro de contas de IA, aviso de licença do Remotion.
Tudo editável depois em "Configurações".

### 5.9 Render
`@remotion/renderer` no processo principal (nunca no da janela), bundle do núcleo gerado no empacotamento,
binários do compositor em `app.asar.unpacked`, Chrome headless baixado/levado pelo Remotion. Codec H.264,
30 fps, 1080×1920 ou 1920×1080.

### 5.10 Distribuição
Electron Forge gerando .dmg (Mac), .exe/Squirrel (Windows), .AppImage/.deb (Linux), publicados nos Releases do
GitHub por CI. Sem assinatura na v1 (README explica como abrir no Mac/Windows).

### 5.11 Idiomas (decisão do Anderson: português e inglês desde a v1)
- **Conteúdo dos vídeos** em pt-BR e en desde a fase 1: o idioma é do projeto (`projeto.json`), e tudo que hoje
  supõe português passa a ser por idioma — fonemas/visemas do espeak (`pt-br` / `en-us`), dicionários de pronúncia
  por serviço e por idioma, guias de formato para a IA de texto (`formatos/<f>/guia.<idioma>.md`), vozes padrão,
  alinhamento do Whisper e textos fixos das cenas (rótulos de cartão, "Ache o bug", HUD).
- A estrutura deve permitir acrescentar outros idiomas só com dados (mapa de visemas, dicionário, guia), sem
  mexer no código.
- **Interface do programa** em pt-BR e en, com textos em arquivos de tradução.

## 6. Fases (cada uma entregável e útil sozinha)
1. **Núcleo** — `nucleo/` com roteiro v2, rig de personagens (2 modelos), cena `cenario` com câmera/luz/HUD,
   legenda palavra a palavra, 9:16 e 16:9, cenas de aula migradas, cenários vetoriais embutidos, `check`.
   Idiomas pt-BR e en (visemas, dicionários, textos fixos).
   Entrega: um vídeo história de ~60 s e uma aula curta, ambos feitos à mão em JSON, renderizados pela CLI,
   cada um em português e em inglês.
   É aqui que se compara lado a lado com a referência antes de seguir.
2. **Provedores e etapas pela CLI** — `provedores/` (texto, imagem, voz), cache por hash, estimativa de custo,
   guias de formato para a IA. Entrega: `giz criar` gera roteiro → cenários → vozes → vídeo por etapas.
3. **Estúdio** — programa Electron com as telas da seção 5.7, editor de personagem, configuração e contas.
4. **Empacotamento** — instaladores dos 3 sistemas por CI, primeira execução guiada, README novo.
5. **Migração** (quando a fila da ElevenLabs do curso ia-software-de-verdade terminar) — adaptador que lê os
   roteiros v1 (`Lesson` com `speaker: 'lia' | 'teo'`) como roteiro v2 com elenco Lia/Téo; publicador do YouTube,
   vídeo por módulo, organizador de pastas e fila passam para o núcleo nas regras novas; `motor/` é apagado.
   As aulas já renderizadas não são refeitas.

## 7. Decidido pelo Anderson
Electron; fluxo por etapas com revisão; contas de IA da própria pessoa (com chave, melhor resultado); elenco livre;
formatos história (referências) e aula; vídeo final como os das referências; não mexer nas aulas prontas;
vídeos em português e inglês desde a v1.

## 8. Chamadas minhas (podem ser revistas)
Personagens em rig vetorial e IA só nos cenários; motor atual congelado em vez de migrar cursos; workspaces no
mesmo repo; provedores da v1 (lista acima); sem assinatura de código na v1;
zod para schema; Electron Forge.

Respostas à revisão do construtor (chamadas minhas):
- **Sem chave nenhuma**: voz Qwen local (CPU em todo sistema; CUDA no Linux e Windows com NVIDIA — DirectML/CoreML
  ficam para depois) **ou gravar a própria voz** pelo programa (fala a fala). Lento na CPU é aceito, com estimativa
  de tempo na tela.
- **Tempo por palavra** é etapa obrigatória do pipeline de voz: usa os tempos do provedor quando existem
  (ElevenLabs) e, senão, alinhamento com Whisper local (~250 MB, baixado junto na primeira execução). A
  interpolação atual (`charToFrame`) fica só como último recurso.
- **No formato história, personagens podem falar** (diálogo com boca sincronizada) **e** existe narrador sem corpo;
  o roteiro já tem `speaker` por fala. Cada personagem tem voz própria.
- **Portão da fase 1**: o Anderson compara com a referência e decide se segue. O rig é uma interface
  (`ModeloDeRig`) que aceita outras implementações — inclusive um modelo de sprites como o da Lia/Téo atual —
  para que trocar o tipo de personagem não exija refazer o resto.
- **Código no formato aula**: o roteiro v2 aceita código **embutido** (gerado pela IA de texto ou colado no editor)
  e, opcionalmente, referência a arquivo para quem usa a CLI.

## 9. Deixado para quem construir
Nome das telas e layout visual do programa; biblioteca de UI; formato exato dos parâmetros de cada modelo de
rig; quais cenários vetoriais entram na biblioteca inicial; detalhes do cache; testes por camada.

## 10. Riscos
- Licença do Remotion para empresas > 3 pessoas (comunicar, não contornar).
- Mac sem assinatura: aviso do Gatekeeper assusta leigos — assinatura custa US$ 99/ano (Apple) e um certificado
  Windows; decisão para a fase 4.
- Tamanho dos modelos locais de voz; GPU só NVIDIA ajuda hoje.
- Qualidade do roteiro gerado varia por modelo de texto: os guias de formato e a validação por schema são a defesa.
- APIs de imagem mudam rápido: adaptadores pequenos e isolados.
