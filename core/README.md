# giz core

Motor de vídeos animados: você escreve um roteiro em JSON e o `giz` gera as vozes, anima os personagens, monta as
cenas e grava um MP4 com legendas. Este guia mostra como criar um projeto, explica cada campo do roteiro e dá um
exemplo de cada recurso. Os nomes dos campos e os valores fixos dos JSON ficam em inglês. Os textos que aparecem no
vídeo seguem o idioma do projeto.

Os exemplos completos estão em [`examples/`](examples/):

| Pasta | O que é |
|---|---|
| `examples/internet-story/pt-BR` e `en` | História 9:16 de ~60 s, "E se a internet parasse por 24 horas?", com narrador e cinco personagens prontos do estilo giz (`casts/presets/present/`), 5 fundos vetoriais (quarto, rua, lanchonete, sala de aula e cidade à noite, três deles a partir de `presets/scenes/`), 6 movimentos de câmera, chuva, HUD com barra e texto grande |
| `examples/coupon-lesson/pt-BR` e `en` | Aula 16:9 sobre um bug de cupom de desconto, com Lia e Téo, escritório e sala de aula na abertura e no fim, cartão, título, código, terminal, pausa "Ache o bug" com contagem, citação e desafio |

Use qualquer uma dessas pastas como ponto de partida: copie a pasta, troque os textos e rode `produce`.

---

## 1. Instalação

Precisa de Node 22.18 ou mais novo.

```bash
cd core
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install
```

Depois, a configuração guiada desta máquina (uma vez; pode rodar de novo quando quiser mudar algo):

```bash
npx giz setup             # pergunta e grava o giz.config.json na raiz do repositório (fora do git)
npx giz setup --dry-run   # só mostra as perguntas e a configuração que resultaria
```

O `setup` escolhe a pasta dos modelos (`~/.cache/giz` por padrão), CPU ou GPU NVIDIA, o modelo de voz Qwen3-TTS
(`0.6b` ou `1.7b`), baixa o modelo e testa a voz. Com GPU, baixa o provider CUDA do ONNX Runtime e as bibliotecas da
NVIDIA em `<pasta-dos-modelos>/cuda/<versão>/lib`, sem sudo (só o driver precisa estar instalado; no WSL ele vem do
Windows). Sem o `giz.config.json`, a voz roda na CPU com os padrões. Um `giz.config.json` feito pelo antigo
`motor/` continua valendo: as chaves são as mesmas.

A voz local baixa o modelo sozinha na primeira fala gerada; `npx giz models` (com `--whisper`, também o Whisper)
adianta o download. `check`, `build`, `render`, `sheet` e os projetos com `"provider": "recording"` não carregam a
voz.

## 2. Criar um projeto

Um projeto é uma pasta com três coisas:

```
meu-video/
├── project.json        o perfil do vídeo (formato, idioma, proporção, elenco, voz)
├── script.json         o roteiro: capítulos e falas, cada fala com sua cena
└── cast/
    ├── narrator.json   um arquivo por personagem; o nome do arquivo é o id
    └── bia.json
```

O `giz` cria sozinho, dentro da pasta:

- `voice/`: as vozes geradas, uma por fala (`<id>.wav` e as palavras com tempo). Só as falas que mudaram são geradas de novo.
- `output/`: `video.mp4`, `captions.srt` e, com `build`, `props.json`.
- `recordings/`: você cria esta pasta só se for gravar a própria voz (veja `voice.provider`). Com qualquer outra voz, uma fala que tenha a sua gravação (`recordings/<id-da-fala>.wav`) usa a gravação, e as demais usam a voz do projeto; apagar a gravação volta a fala para a voz do projeto.

`voice/` e `output/` não vão para o git.

Passo a passo (os projetos ficam fora do repositório, em `~/giz/projetos/<nome>`):

1. Copie um exemplo: `mkdir -p ~/giz/projetos && cp -r examples/internet-story/pt-BR ~/giz/projetos/meu-video`.
2. Edite `project.json`, os personagens em `cast/` e as falas em `script.json`.
3. Rode `npx giz check ~/giz/projetos/meu-video` até dar `0 erro(s)`.
4. Rode `npx giz produce ~/giz/projetos/meu-video`.

## 3. Comandos

Todos rodam dentro de `core/`: `npx giz <comando> <pasta-do-projeto>` (o mesmo que `npm run giz -- <comando> ...`
ou `node src/presentation/cli/giz.ts <comando> ...`).

| Comando | O que faz |
|---|---|
| `check <pasta>` | Valida os JSON e confere cada fala: texto que não cabe, caixas sobrepostas, algo fora da área segura, número de `[trechos]` diferente do número de `beats`, personagem fora do elenco. Sai com código 1 se houver erro. |
| `voice <pasta>` | Gera as vozes que faltam ou que mudaram e alinha as palavras (Whisper). |
| `build <pasta>` | Monta a linha do tempo e grava `output/props.json`. |
| `render <pasta>` | Renderiza `output/video.mp4` e `output/captions.srt` com as vozes que já existem. |
| `produce <pasta>` | Faz tudo em ordem: `check`, vozes, linha do tempo, render e legendas. Para no primeiro erro do `check`. |
| `sheet <rig> [personagem.json]` | Desenha a ficha de um rig (poses, expressões, bocas) em `output/sheet-<nome>.png`. |
| `setup [--defaults] [--dry-run]` | A configuração guiada desta máquina (seção 1). `--defaults` aceita todas as respostas padrão. |
| `models [--whisper]` | Baixa agora o modelo de voz do `giz.config.json` (e o Whisper, com `--whisper`). |
| `gpu info \| install` | Mostra o que a configuração da GPU vê, ou instala o provider CUDA e as bibliotecas da NVIDIA. |
| `qa asr <pasta>` | O "ouvido" automático: o Whisper transcreve cada voz e conta as palavras erradas contra a legenda; grava `output/asr.txt` e `output/asr.json`. |
| `qa asr-aggregate <pasta>` | Junta os `output/asr.json` dos projetos de uma pasta (as aulas de um curso) e lista as palavras erradas em duas ou mais. |
| `qa pitch <pasta>` | Quantos semitons o fim de cada pergunta sobe (+) ou desce (−). |
| `qa voices [saída] [voz1,voz2] [estilo]` | Gera as mesmas frases com cada voz Qwen e mede quanto o Whisper entende. |
| `qa lexicon [testes.json] [voz]` | Testa grafias para o dicionário de pronúncia: `[{"word":"deploy","frame":"Fiz o X ontem.","candidates":["deploy","diplói"]}]`. |
| `sounds [pasta]` | Sintetiza os efeitos sonoros (`pop`, `whoosh`, `ding`...) em `public/sounds/`, iguais byte a byte aos versionados. |
| `new --idea <ideia.json> <pasta>` | Cria um projeto com o roteiro escrito por uma IA de texto a partir da ideia (veja abaixo). Mostra antes o custo estimado. `--provider anthropic\|openai\|gemini` escolhe a IA (sem ele, a primeira com chave); `--estimate` só mostra o custo. |
| `script <pasta>` | Escreve de novo o roteiro de um projeto a partir do `idea.json` dele, mantendo a voz do `project.json`. Aceita as mesmas opções. |
| `images <pasta>` | Gera com uma IA de imagem os cenários marcados com `background.generate` (seção 8.2) em `scenes/<id-da-fala>.png` e aponta o `background.image` da cena para eles. Mostra antes o custo estimado; uma imagem cujo prompt, estilo, proporção, provedor e modelo não mudaram nunca é gerada de novo. `--provider openai\|gemini\|fal` (sem ele: o `imageProvider` do projeto, ou o primeiro com chave); `--estimate` só mostra o custo; `--only <fala>` só aquela cena; `--force <fala>` gera aquela de novo mesmo em dia. |
| `status <pasta>` | Mostra cada etapa do projeto (ideia → roteiro → elenco → cenários → vozes → vídeo) como `✓ feito`, `○ a fazer`, `! desatualizado` (no roteiro, `! com erros`, com os erros embaixo) ou `· vazio`, com as falas cuja voz falta ou ficou desatualizada e as cenas cuja imagem falta ou ficou desatualizada. Mudar o texto de uma fala marca só a voz dela; mudar o prompt de uma cena marca só aquela imagem; o vídeo fica desatualizado quando um arquivo do projeto mudou depois do render ou quando falta alguma voz ou imagem. Depois, o custo do que falta: o roteiro (quando ainda não existe, ou com `--regenerate-script`), as imagens e as vozes pagas (ElevenLabs por caractere, Fish por byte; Qwen e gravação própria são grátis). Uma parte sem preço conhecido aparece como `desconhecido`, e o total também. Não chama nenhum serviço. |
| `keys list` | Mostra quais serviços pagos têm chave (`anthropic`, `openai`, `gemini`, `fal`, `elevenlabs`, `fish`) e onde pôr as que faltam. Nunca mostra a chave. |
| `keys test <anthropic\|openai\|gemini>` | Faz **uma** chamada real e mínima (frações de centavo) para conferir a chave e responde `ok` ou o erro. |

As chaves das IAs de texto vêm de `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` e `GEMINI_API_KEY`, ou de
`~/.config/giz/<serviço>.key`. O modelo de cada uma muda com `GIZ_ANTHROPIC_MODEL`, `GIZ_OPENAI_MODEL` e
`GIZ_GEMINI_MODEL` (padrões: `claude-sonnet-5-5`, `gpt-6.2-astra` e `gemini-3.8-flash`).

As IAs de imagem usam `OPENAI_API_KEY`, `GEMINI_API_KEY` e `FAL_KEY` (ou `~/.config/giz/fal.key`). O modelo muda com
`GIZ_OPENAI_IMAGE_MODEL`, `GIZ_GEMINI_IMAGE_MODEL` e `GIZ_FAL_IMAGE_MODEL` (padrões: `gpt-image-2.6-sunburst`,
`gemini-nano-banana-2.1` e `fal-ai/flux-2-pro`). O custo estimado é por imagem, na tabela de preços de cada serviço;
o do GPT Image é uma aproximação (a OpenAI não publica os tokens por imagem dos modelos atuais).

**Roteiro com IA.** O `idea.json` descreve o vídeo:

```json
{ "format": "story", "aspect": "9:16", "targetSeconds": 30, "theme": "E se os gatos acordassem falando?",
  "audience": "jovens nas redes sociais", "tone": "engraçado", "language": "pt-BR",
  "cast": ["bia", "caio"], "scenes": ["street", "castle-rain"] }
```

`targetSeconds` vai de 10 a 900. `cast` (ids de `casts/presets/` e `casts/example/`) e `scenes` (fundos vetoriais ou
cenas de `presets/scenes/`) são opcionais: sem eles, a IA escolhe. A IA segue o guia do formato
(`formats/<story|lesson>/guide.<pt-BR|en>.md`) e o esquema do roteiro (gerado dos próprios esquemas de validação).
A resposta passa pela mesma validação do `check`; se houver erro, a lista volta para a IA corrigir, até 3 vezes. A
pasta só é escrita com um projeto válido: `idea.json`, `project.json`, `script.json` e `cast/` (cópias dos
personagens prontos). Se a resposta ainda tiver erro depois das 3 correções, a pasta não é tocada e a última resposta fica
em `<pasta>.draft/` (`answer.json` e `problems.txt`), para corrigir à mão. Nenhum vídeo, canal ou personagem existente é imitado: o guia proíbe.

Exemplos:

```bash
npx giz check examples/coupon-lesson/pt-BR
npx giz produce examples/internet-story/en
npx giz sheet giz examples/internet-story/pt-BR/cast/bia.json
```

Para ver um quadro só, sem renderizar o vídeo inteiro, rode `build` e depois:

```bash
npx remotion still src/presentation/remotion/index.ts Video quadro.png \
  --props=examples/internet-story/pt-BR/output/props.json \
  --public-dir=examples/internet-story/pt-BR --frame=300
```

## 4. `project.json`

```json
{
  "version": 2,
  "title": "E se a internet parasse por 24 horas?",
  "format": "story",
  "language": "pt-BR",
  "aspect": "9:16",
  "captionStyle": "words",
  "cast": ["narrator", "bia", "caio", "otavio", "nono", "helena"],
  "voice": { "provider": "qwen", "model": "1.7b" }
}
```

| Campo | Obrigatório | Valores | Para que serve |
|---|---|---|---|
| `version` | sim | `2` | A versão do formato do roteiro. |
| `title` | sim | texto | O título do vídeo. |
| `format` | sim | `story`, `lesson` | `story`: cenários com personagens, sem moldura. `lesson`: cenas de aula (código, cartão, terminal...) com os apresentadores ao lado. |
| `language` | sim | `pt-BR`, `en` | O idioma da voz, da legenda e dos rótulos fixos do vídeo. |
| `aspect` | sim | `9:16` (1080×1920), `16:9` (1920×1080) | A proporção. O vídeo sai a 30 quadros por segundo. |
| `captionStyle` | não | `words`, `blocks` | O estilo da legenda (seção 9). Sem ele, `story` usa `words` e `lesson` usa `blocks`. |
| `brand` | não | texto | Uma marca no canto superior esquerdo. Só aparece em aula 16:9. |
| `cast` | sim | lista de ids | Quem participa. Cada id precisa de um `cast/<id>.json`. |
| `voice.provider` | sim | `qwen`, `recording`, `elevenlabs`, `fish` | `qwen`: voz local gerada na GPU (ou CPU). `recording`: você grava cada fala em `recordings/<id-da-fala>.wav` (WAV PCM de 16 bits); o `check` avisa sobre gravação ausente ou inválida, e uma gravação refeita gera a fala de novo. `elevenlabs` e `fish`: os serviços pagos (veja abaixo). |
| `style` | não | `painted-2d`, `flat-vector`, `watercolor`, `chalk` | O estilo dos cenários gerados por IA (`giz images`), igual em todas as cenas. Sem ele, `painted-2d`. |
| `imageProvider` | não | `openai`, `gemini`, `fal` | A IA de imagem do projeto, para o `giz images`. |
| `voice.model` | não | `0.6b`, `1.7b` | O modelo Qwen. O `1.7b` é mais natural e é o único que segue o `style` da voz. Sem ele, vale o `giz.config.json`. Trocar o modelo aqui gera as vozes de novo. |

**Serviços de voz pagos.** Com `elevenlabs` ou `fish`, o `voice.id` de cada personagem é o id da voz no serviço. A
chave vem de `ELEVENLABS_API_KEY` / `FISH_API_KEY` ou de `~/.config/giz/elevenlabs.key` / `~/.config/giz/fish.key`
(fora do repositório; o giz nunca a mostra). Falhas de rede são tentadas de novo até 4 vezes, e respostas 429 e 5xx
até 3. Na ElevenLabs, cada fim de frase e dois-pontos ganha uma pausa `<break>` de 0,15 s (`GIZ_SENTENCE_PAUSE`;
vírgula: `GIZ_COMMA_PAUSE`, 0 por padrão). O modelo: `GIZ_ELEVENLABS_MODEL` (padrão `eleven_multilingual_v2`) e
`GIZ_FISH_MODEL` (padrão `s1`). Os nomes antigos do motor (`ELEVEN_MODEL`, `FISH_MODEL`, `PAUSA_PONTO`,
`PAUSA_VIRGULA`) também valem. Trocar modelo ou pausa gera as vozes de novo.

**Dicionário de pronúncia.** Cada serviço tem o seu, na pasta do projeto: `pronunciation.json` (Qwen),
`pronunciation.elevenlabs.json` e `pronunciation.fish.json` — um objeto `{"palavra": "grafia para a voz"}`. A
palavra é trocada inteira, sem diferenciar maiúsculas, só no que a voz fala; a legenda mantém o roteiro. As grafias
feitas para o Qwen ("gê pê tê") confundem vozes que já leem nomes em inglês, por isso cada serviço tem o seu arquivo.
Mudar o dicionário gera de novo só as falas que ele afeta.

## 5. Personagens (`cast/<id>.json`)

```json
{
  "id": "bia",
  "name": "Bia",
  "rig": "giz",
  "parameters": { "outfit": "hoodie", "outfitColor": "#8b5fbf", "headwear": "headphones", "skin": "deep", "hair": "afro" },
  "voice": {
    "id": "vivian",
    "style": "Fale em português do Brasil, com sotaque brasileiro, de forma exagerada e engraçada, como uma streamer jovem e dramática"
  },
  "personality": "streamer animada que narra a própria vida em voz alta",
  "defaultExpression": "excited"
}
```

| Campo | Obrigatório | Para que serve |
|---|---|---|
| `id` | sim | O mesmo nome do arquivo, em minúsculas. É o que o roteiro usa em `speaker` e `characters`. |
| `name` | sim | O nome que aparece na legenda do `.srt`. |
| `rig` | não | O desenho do corpo (seção 6). Sem `rig`, o personagem é só voz, como um narrador, e não pode entrar em cena. |
| `parameters` | não | A aparência, conforme o rig. Os que faltam usam o padrão do rig. |
| `voice.id` | sim | A voz Qwen: `serena`, `vivian`, `uncle_fu`, `ryan`, `aiden`, `ono_anna`, `sohee`, `eric` ou `dylan`. As mesmas vozes falam pt-BR e inglês (o idioma vem do projeto). Com `"provider": "qwen"`, outro valor é erro do `check`; com `elevenlabs` ou `fish`, é o id da voz no serviço. |
| `voice.style` | não | Uma instrução de como falar (sotaque, ritmo, humor). Só o modelo `1.7b` a segue. Em pt-BR, peça o sotaque brasileiro. |
| `personality` | não | Uma nota para quem escreve o roteiro. O vídeo não usa. |
| `defaultExpression` | sim | A expressão de quando ninguém pede outra (seção 7). |

Um narrador, só voz:

```json
{
  "id": "narrator",
  "name": "Narrador",
  "voice": { "id": "ryan", "style": "Fale em português do Brasil, com sotaque brasileiro, como um narrador de documentário curioso" },
  "defaultExpression": "neutral"
}
```

## 6. Rigs e parâmetros

O `check` recusa um parâmetro que o rig não tem, um valor fora da lista ou uma cor que não é `#rrggbb`, e diz o
arquivo, o campo e o valor. Veja um rig desenhado com `giz sheet <rig>`.

### `giz` (estilo giz, o padrão da casa)

O visual próprio do giz: cabeça colorida com tom de pele, contorno de giz (um traço esbranquiçado levemente
irregular, igual em todo quadro), olhos arredondados com íris colorida, pupila e brilho, um pontinho de nariz e, se
quiser, bochechas e sardas. Quem só escuta fica de boca fechada (um sorriso vira sorriso fechado).

| Parâmetro | Tipo | Padrão | Valores |
|---|---|---|---|
| `species` | opção | `human` | `human`, `zombie`, `vampire`, `werewolf`, `mummy`, `ghost`, `robot`, `alien`, `slime-monster` (criaturas, abaixo) |
| `skin` | opção | `medium` | `light`, `fair`, `medium`, `tan`, `brown`, `deep` (do mais claro ao mais escuro); peles de criatura: `grey-green`, `pale`, `fur`, `linen`, `mist`, `steel`, `green`, `lilac`, `lime`, `tangerine` |
| `headShape` | opção | `round` | `round`, `oval`, `soft-square`, `bean` |
| `eyeColor` | cor | `#7a4a26` | a cor da íris |
| `hairColor` | cor | `#3a2418` | o cabelo e as sobrancelhas |
| `cheeks` | sim/não | `true` | bochechas rosadas |
| `freckles` | sim/não | `false` | sardas |
| `chalk` | sim/não | `true` | o contorno de giz |
| `outfit` | opção | `casual` | a roupa, por época (lista abaixo) |
| `outfitColor` | cor | `auto` | a cor principal da roupa; `auto` usa a paleta da própria roupa (mangas e calça da mesma cor acompanham) |
| `accessoryColor` | cor | `auto` | os detalhes da roupa (gravata, cinto, botões), o prendedor do cabelo e os óculos |
| `hair` | opção | `short` | `bald`, `short`, `long`, `curly`, `afro`, `braids`, `bun`, `ponytail`, `mohawk` |
| `headwear` | opção | `none` | chapéus, capacetes e acessórios de cabeça (lista abaixo) |
| `headwearColor` | cor | `auto` | a cor principal do chapéu; `auto` usa a dele |
| `facialHair` | opção | `none` | `beard`, `mustache`, `goatee`, `stubble` (barba por fazer) |
| `glasses` | sim/não | `false` | |
| `eyeScale` | número | `1` | de `0.8` a `1.4` |

```json
{ "rig": "giz", "parameters": { "skin": "tan", "headShape": "soft-square", "eyeColor": "#4c9a5a", "outfit": "hoodie", "hair": "short", "glasses": true } }
```

Roupas (`outfit`), cada uma com a sua paleta:

- passado: `caveman`, `ancient-egypt`, `toga`, `viking`, `knight`, `commoner`, `renaissance`, `pirate`, `victorian`,
  `1920s`, `1950s`;
- presente: `casual`, `hoodie`, `dress`, `suit`, `school-uniform`, `lab-coat`, `scrubs`, `chef`, `athlete`, `hi-vis`;
- futuro: `spacesuit`, `cyber`, `robot-armor`, `utopian`.

Na cabeça (`headwear`): `crown`, `laurel`, `viking-helmet`, `knight-helmet`, `pirate-hat`, `top-hat`, `flat-cap`,
`beret`, `cap`, `chef-hat`, `hard-hat`, `space-helmet`, `visor`, `headphones`, `witch-hat`, `hat`, `scarf`. O cabelo,
a barba e o que vai na cabeça acompanham o formato da cabeça (`headShape`). O visor e o capacete espacial são
transparentes: os olhos continuam aparecendo.

Criaturas (`species`): o mesmo corpo, então toda pose, expressão e visema continua funcionando (a boca fala igual).
Cada uma tem a sua pele (escolher outra pele de criatura troca a cor, como um alienígena `lilac`) e os seus detalhes:

- `zombie`: pele verde-acinzentada, pontos de costura, um olho caído de sono e a roupa rasgada;
- `vampire`: pele pálida, orelhas pontudas, presinhas e capa com gola alta;
- `werewolf`: orelhas e tufos de pelo, focinho, nariz grande e garras;
- `mummy`: faixas na cabeça e no corpo todo, braços e pernas enfaixados (não usa roupa);
- `ghost`: transparente, sem pernas, flutua balançando devagar (não usa roupa);
- `robot`: cabeça de metal, antena, parafusos e olhos de LED na cor `eyeColor`;
- `alien`: olhos grandes, duas antenas e pele colorida;
- `slime-monster`: corpo de gosma laranja com pingos e bolhas, sem pernas (não usa roupa; `lime` ou `green` também servem).

Personagens prontos: `casts/presets/past/`, `present/` e `future/` têm elencos de exemplo, e `casts/presets/creatures/`
tem as criaturas (nome, personalidade e voz do Qwen). Copie o arquivo para o `cast/` do projeto, acrescente o `id` em `project.json` e ajuste o que quiser.

### `lia-style` (estilo Lia)

Personagem de moletom com cabelo em degradê, como os apresentadores das aulas. Lia e Téo prontos ficam em
`casts/example/` (`lia.json`, `teo.json`), com o guia editorial (`editorial-guide.md`: personalidade e regras de
diálogo) e a ficha visual (`lia-teo-sheet.png`).

| Parâmetro | Tipo | Padrão | Valores |
|---|---|---|---|
| `skin` | cor | `#FDD6B0` | |
| `hairColor`, `hairColor2` | cor | `#E817DF`, `#6D1AE6` | o degradê do cabelo, de cima para baixo |
| `hair` | opção | `bun` | `long`, `short`, `shaved`, `bun` |
| `hoodieColor`, `hoodieShade` | cor | `#8B3FF5`, `#6A22D6` | o moletom e a sombra dele |
| `emblem` | opção | `star` | `star`, `code`, `none` |
| `glasses` | sim/não | `true` | |
| `glassesColor` | cor | `#6D1AE6` | |
| `browWidth` | número | `7` | de `5` a `12` |
| `browArch` | número | `7` | de `0` a `9` |
| `smile` | número | `30` | de `18` a `34` |

```json
{ "rig": "lia-style", "parameters": { "hair": "short", "hoodieColor": "#4F35D9", "hoodieShade": "#3A22B0", "emblem": "code" } }
```

## 7. O roteiro (`script.json`)

```json
{
  "chapters": ["O desastre", "O suspeito"],
  "lines": [
    { "id": "001", "chapter": 1, "speaker": "teo", "text": "Um cliente pagou mais caro.", "scene": { "type": "talk" } },
    { "id": "002", "chapter": 2, "speaker": "lia", "text": "Vamos ver o código." }
  ]
}
```

- `chapters`: os nomes dos capítulos, em ordem. Na aula 16:9 o nome aparece no canto superior esquerdo.
- `lines`: as falas, na ordem em que acontecem.

### Campos de uma fala

| Campo | Obrigatório | Valores | Para que serve |
|---|---|---|---|
| `id` | sim | texto único | Identifica a fala: o nome do áudio em `voice/`, da gravação em `recordings/` e dos erros do `check`. |
| `chapter` | sim | 1, 2, ... | O capítulo, contado a partir de 1. |
| `speaker` | sim | id do elenco | Quem fala. Só ele mexe a boca. |
| `text` | sim | texto | O que a legenda mostra. Os `[trechos]` entre colchetes marcam os `beats`. |
| `pronunciation` | não | texto | O que a voz fala, quando deve ser diferente da legenda (sigla, palavra estrangeira). |
| `pose` | não | veja abaixo | A pose de quem fala. O gesto forte acontece uma vez, quando a pose começa. |
| `expression` | não | veja abaixo | A expressão de quem fala. |
| `look` | não | `camera`, `other`, `content` | Para onde quem fala olha: para quem assiste, para o outro personagem ou para o conteúdo da cena. |
| `reaction` | não | `{ expression, pose, look }` | Como os outros personagens reagem enquanto a fala acontece. Quem escuta só reage com o corpo. |
| `scene` | não | seção 8 | A cena que começa nesta fala. Sem `scene`, a fala continua na cena anterior. A primeira fala precisa ter uma (o `check` aponta quando falta). |
| `beats` | não | lista | Uma mudança para cada `[trecho]` do texto, na mesma ordem. Veja abaixo. |
| `holdAfter` | não | `{ "seconds": 3, "label": "Ache o bug" }` | Uma pausa depois da fala, para quem assiste pensar, marcada por um tique a cada segundo. Durante a pausa, o rótulo aparece com a contagem regressiva no lugar da legenda. |
| `sfx` | não | veja abaixo | Um som no começo da fala. |

Poses: `neutral`, `explain`, `point`, `wave`, `raise`, `think`, `shrug`, `celebrate`, `hand-on-head`, `hands-on-mouth`.

Expressões: `neutral`, `happy`, `excited`, `surprised`, `confused`, `thinking`, `skeptical`, `worried`, `angry`, `scared`.

Sons (`sfx`): `pop`, `whoosh`, `ding`, `dings`, `error`, `success`, `tick`. Além deles, toda cena nova depois da
primeira já toca um `whoosh` sozinha.

Uma fala com pose, expressão, olhar e reação:

```json
{
  "id": "04",
  "chapter": 2,
  "speaker": "bia",
  "text": "Caio, é a terceira vez que a gente passa nessa esquina.",
  "pose": "shrug",
  "expression": "skeptical",
  "look": "other",
  "reaction": { "expression": "confused" }
}
```

Uma pronúncia diferente da legenda:

```json
{ "text": "Sem sinal, sem Wi-Fi.", "pronunciation": "Sem sinal, sem uai-fai." }
```

### `beats`: mudanças no meio da fala

Cada `[trecho]` do texto dispara o beat de mesma posição quando a voz chega nele. O `check` dá erro se houver mais
trechos que beats, ou o contrário. Um beat pode trazer `expression`, `pose` e `sfx` para quem fala, e qualquer campo
da cena atual. Assim um cartão revela um item, o código destaca uma linha ou o terminal mostra a saída.

```json
{
  "text": "Um cliente [usou um cupom de desconto]... e [pagou mais caro].",
  "scene": { "type": "card", "variant": "ticket", "title": "Reclamação #4521", "items": ["Usei o cupom BEMVINDO", "Paguei R$ 10 a mais"], "shown": 0 },
  "beats": [{ "shown": 1, "sfx": "pop" }, { "shown": 2, "sfx": "error" }]
}
```

Se a `pronunciation` tiver colchetes, os trechos dela é que valem:

```json
{
  "text": "Se o cupom for [BEMVINDO], tira dez reais.",
  "pronunciation": "Se o cupom for [bem-vindo], tira dez reais.",
  "beats": [{ "highlight": ["cupom === 'BEMVINDO'"] }]
}
```

## 8. Cenas

O `type` escolhe a cena. Uma história usa `scenario`. Uma aula usa as cenas de aula. Nenhum texto pode sair da área
segura nem ficar por cima de outro: o `check` mede cada caixa e aponta a fala que não coube.

### 8.1 `scenario`: cenário com personagens

```json
{
  "type": "scenario",
  "background": { "vector": "street" },
  "characters": [{ "character": "caio", "position": "left" }, { "character": "bia", "position": "right" }],
  "camera": { "type": "shake", "intensity": 1.2 },
  "effects": [{ "type": "rain" }, { "type": "vignette" }],
  "hud": { "fields": [{ "label": "HORA", "value": "3" }, { "label": "SEM", "value": "SINAL" }], "bar": { "label": "pânico", "value": 40 } },
  "highlight": { "text": "24 HORAS SEM INTERNET" }
}
```

| Campo | Obrigatório | Para que serve |
|---|---|---|
| `background` | sim | O fundo: `{ "vector": "<nome>" }` ou `{ "image": "<arquivo>" }`. |
| `characters` | sim | Quem está em cena, de trás para a frente. Pode ser `[]`. No máximo 2 em 9:16 e 3 em 16:9. |
| `camera` | não | O movimento da câmera durante a cena (8.3). |
| `effects` | não | Efeitos de luz e de clima (8.4). |
| `hud` | não | O painel de informações no canto superior esquerdo (8.5). |
| `highlight` | não | O texto grande no meio da tela (8.6). |

**Personagem em cena:**

| Campo | Valores | Para que serve |
|---|---|---|
| `character` | id do elenco | Precisa ter `rig`. |
| `position` | `left`, `center`, `right` ou `{ "x": 0.3, "y": 0.8 }` | O lugar dos pés. Os números são frações da largura e da altura do quadro. Em 9:16, o segundo personagem fica menor e mais atrás. |
| `scale` | número | O tamanho, multiplicado sobre o padrão. |
| `direction` | `front`, `left`, `right` | Para onde o corpo vira. Sem ele, cada um vira para o centro. |

```json
{ "character": "caio", "position": { "x": 0.62, "y": 0.78 }, "scale": 0.9, "direction": "left" }
```

### 8.2 Fundos

Os fundos vetoriais têm três camadas que se movem em velocidades diferentes com a câmera:

| `vector` | Cena |
|---|---|
| `room` | sala com janela, estante e tapete |
| `street` | rua de cidade ao entardecer, com lojas |
| `field` | campo com morros, árvore e cerca |
| `night-sky` | céu estrelado com lua e cabana |
| `lab` | laboratório com frascos e bancada |
| `village` | vila num morro de manhã, com moinho, poço e barraca de frutas |
| `cave` | caverna com pinturas, estalactites, abertura para o pôr do sol e um círculo de pedras para a fogueira |
| `ancient-egypt` | deserto à beira do rio, com pirâmides, obelisco e palmeiras |
| `ancient-rome` | fórum com colunatas e um templo no morro |
| `medieval-castle` | castelo com torres e bandeirolas num morro, muralha e pátio de grama |
| `pirate-ship` | convés de um veleiro, com vela, cordas, amurada e o mar |
| `victorian-street` | rua dos anos 1800, com sobrados, relógio e lampiões a gás |
| `fifties-diner` | lanchonete dos anos 50, com neon, balcão, banquetas, piso xadrez e jukebox |
| `classroom` | sala de aula de manhã, com quadro de giz, janelas e carteiras |
| `office` | escritório moderno, com janelão para a cidade, mesas e plantas |
| `city-night` | cidade à noite, com lua, torre de antena, prédios acesos e postes |
| `space-station` | estação espacial, com janela redonda para um planeta, consoles e caixotes |
| `cyber-city` | cidade do futuro à noite, com neon, holograma e carros voadores |
| `graveyard` | cemitério à noite (assustador, mas fofo), com capelinha, lua, névoa e abóboras |
| `haunted-house` | salão de casarão assombrado, com janela de lua, retratos, relógio e velas |

Todos os fundos seguem a mesma planta (`BackdropLayout`, no domínio): o chão onde os pés pisam, o horizonte 150
unidades acima dele, o palco onde os personagens ficam livres de objetos da frente, os dois cantos de baixo para os
objetos da camada da frente e o ponto de destaque (uma janela, um monumento) entre os personagens em 16:9 e acima das
cabeças, abaixo do HUD, em 9:16. O destaque cabe num raio de 150 unidades; um destaque largo (o janelão do escritório,
a verga da vela) usa a largura de destaque, que fica entre os dois personagens em 16:9. Assim cada fundo funciona nas duas proporções.

`colors` troca cores da paleta, uma a uma. Os nomes ficam em `src/domain/scenario/palettes/` (por exemplo `skyTop`,
`skyBottom` e `window` na `street`). Um nome que o fundo não tem é erro na validação, com a lista dos nomes válidos.

```json
{ "background": { "vector": "street", "colors": { "skyTop": "#0b1230", "skyBottom": "#3a2a5a" } } }
```

Uma imagem própria fica dentro da pasta do projeto, com o caminho relativo a ela (sem `/` no começo, sem `./` e sem
`..` que saia da pasta: o `check` recusa). Ela deve ter a proporção do vídeo: um PNG ou JPEG com outra proporção (mais
de 5% de diferença) gera um aviso, porque o render corta as bordas para cobrir o quadro. Se o arquivo não existir, o
`check` avisa e o vídeo usa o fundo vetorial (o `vector` dado ou `room`):

```json
{ "background": { "image": "images/praia.png", "vector": "field" } }
```

**Cenário gerado por IA.** Com `generate`, o `giz images` cria a imagem a partir do `prompt` (no estilo do projeto, ou
no `style` da cena) e grava `scenes/<id-da-fala>.png`, já na proporção do vídeo e 12% maior que o quadro (a folga da
câmera). O pedido à IA deixa livre o lugar onde os personagens ficam, sem texto, marcas ou lugares reais. Até a imagem
existir, o `check` avisa e o vídeo usa o fundo vetorial. Só a cena de uma fala aceita `generate` (não um `beat`):

```json
{ "background": { "generate": { "prompt": "uma praça de cidade pequena ao entardecer", "style": "watercolor" }, "vector": "street" } }
```

#### Cenas prontas (`presets/scenes/`)

`presets/scenes/<nome>.json` guarda cenários prontos: fundo, efeitos, movimento de câmera e, às vezes, cores trocadas.
Cada arquivo tem `name` e `description` em pt-BR e uma `scene` completa com `"characters": []`:

| Arquivo | Cena |
|---|---|
| `cave-campfire` | caverna à luz da fogueira |
| `desert-noon` | deserto ao meio-dia |
| `forum-noon` | fórum ao meio-dia |
| `castle-rain` | castelo sob chuva |
| `deck-storm` | convés em tempestade |
| `victorian-fog` | rua vitoriana na névoa |
| `diner-evening` | lanchonete dos anos 50 |
| `classroom-morning` | sala de aula de manhã |
| `office-late` | escritório no fim da tarde |
| `city-night-walk` | cidade à noite |
| `station-alert` | estação espacial em alerta |
| `cyber-night` | cidade cyber à noite |
| `graveyard-fog` | cemitério com névoa |
| `haunted-candlelight` | casarão assombrado à luz de vela |
| `village-morning` | vila de manhã |
| `starry-camp` | acampamento sob as estrelas |

Para usar uma, copie o objeto `scene` do arquivo para a `scene` da fala e preencha `characters` (e, se quiser, `hud`
ou `highlight`). Por exemplo, com `presets/scenes/castle-rain.json`:

```json
{
  "id": "4", "chapter": 1, "speaker": "bento", "text": "Lá vem chuva de novo.",
  "scene": {
    "type": "scenario",
    "background": { "vector": "medieval-castle", "colors": { "skyTop": "#2f3a4f", "skyBottom": "#7d8b99", "cloud": "#9aa6b2" } },
    "characters": [{ "character": "bento", "position": "left" }, { "character": "adelaide", "position": "right" }],
    "camera": { "type": "zoom-out", "easing": "smooth" },
    "effects": [{ "type": "rain", "intensity": 1.2 }, { "type": "tint", "color": "#4a6a8a", "intensity": 0.5 }, { "type": "vignette", "intensity": 0.8 }]
  }
}
```

Depois de copiar, a cena é sua: mude o que quiser. Os testes validam cada cena pronta pelo esquema do roteiro e passam a
cena validada pelo `check` de layout nas duas proporções, com o máximo de personagens (2 em 9:16, 3 em 16:9), um HUD de
dois campos com barra e o texto grande "E SE A INTERNET PARASSE?". Um texto grande bem mais longo pode não caber em
16:9; o `check` aponta.

### 8.3 Câmera

A câmera vai do começo ao fim da cena, que termina quando outra fala declara uma `scene`.

| `type` | O que faz |
|---|---|
| `still` | Parada, no enquadramento de `from` (ou `to`). |
| `zoom-in` | Aproxima de 1× até 1,3×. |
| `zoom-out` | Afasta de 1,3× até 1×. |
| `pan` | Desliza da esquerda para a direita, com 1,1× de zoom. |
| `follow` | Vai até um personagem (`target`) e desacelera ao chegar. |
| `shake` | Tremida contínua. `intensity` multiplica a força (1 é o normal). |

Campos opcionais:

- `from` e `to`: o enquadramento `{ "x": 0, "y": 0, "zoom": 1.2 }`. `x` e `y` deslocam a imagem em frações do quadro.
- `target`: o id de um personagem da cena.
- `intensity`: a força da tremida.
- `easing`: `smooth` (padrão) ou `linear`.

```json
{ "camera": { "type": "follow", "target": "bia" } }
{ "camera": { "type": "zoom-out", "from": { "x": 0, "y": -0.04, "zoom": 1.25 } } }
{ "camera": { "type": "zoom-in", "to": { "x": 0, "y": 0.05, "zoom": 1.2 }, "easing": "linear" } }
```

### 8.4 Efeitos

Cada efeito aceita `intensity` (de 0 a 3, sendo 1 o normal), `color` (`#rrggbb`) e `position` (`{ x, y }` em frações do
quadro, para os efeitos que têm um centro).

| `type` | O que faz |
|---|---|
| `vignette` | Escurece as bordas. |
| `glow` | Um brilho de luz, no alto e no meio da tela por padrão. |
| `particles` | Partículas de poeira flutuando. |
| `fire` | Fogueira com brasas e luz tremulando, à direita por padrão. |
| `rain` | Chuva. |
| `snow` | Neve. |
| `tint` | Pinta a tela inteira com `color`. |

```json
{ "effects": [{ "type": "fire", "position": { "x": 0.5, "y": 0.72 } }, { "type": "vignette" }] }
{ "effects": [{ "type": "tint", "color": "#b8402f", "intensity": 0.2 }] }
{ "effects": [{ "type": "glow", "color": "#5fc3ff" }, { "type": "snow", "intensity": 2 }] }
```

### 8.5 HUD

Um painel no canto superior esquerdo. Os campos ficam numa linha só, separados por `·`. A barra é opcional e vai de
0 a 100.

```json
{
  "hud": {
    "fields": [{ "label": "HORA", "value": "3" }, { "label": "SEM", "value": "SINAL" }],
    "bar": { "label": "pânico", "value": 40 }
  }
}
```

Isso aparece como `HORA 3 · SEM SINAL` e, embaixo, a barra `pânico` com `40%`. Para a barra subir ao longo do vídeo,
declare a cena de novo com outro `value`.

### 8.6 Texto grande (`highlight`)

Um título em letras grossas entre o HUD e a legenda, com até 3 linhas em 9:16 e 2 em 16:9. `entrance` pode ser `pop`
(cresce com um pequeno salto, o padrão) ou `rise` (sobe de baixo).

```json
{ "highlight": { "text": "CABOS NO FUNDO DO MAR", "color": "#7ee08a", "entrance": "rise" } }
```

### 8.7 Cenas de aula

Numa aula, os personagens com corpo do elenco (no máximo 2) ficam ao lado do conteúdo. Em 16:9 o conteúdo fica à
direita. Em 9:16 fica em cima.

**`title`**: a abertura.

```json
{ "type": "title", "overline": "Lia e Téo explicam · Aula 01", "title": "O cupom que deixava mais caro", "subtitle": "Um caso para investigar" }
```

**`card`**: uma lista com título. `variant` muda a cor e o rótulo (`objective`, `summary`, `challenge`, `next`,
`ticket`, `rule`). `shown` diz quantos itens já aparecem. Os beats revelam os outros.

```json
{ "type": "card", "variant": "challenge", "title": "Desafio", "items": ["Escreva o teste", "Corrija o código"], "shown": 0 }
```

**`code`**: código embutido, com cores. `added` marca as linhas novas (índices a partir de 0). `highlight` destaca as
linhas que contêm algum dos textos. A fala que abre um código ganha uma pausa de leitura de 4 a 9 s.

```json
{
  "type": "code",
  "title": "exemplo.ts",
  "lines": [
    "export function precoFinal(subtotal: number, cupom?: string): number {",
    "  if (cupom === 'BEMVINDO') return subtotal - 10;",
    "  return subtotal;",
    "}"
  ],
  "added": [1],
  "highlight": ["subtotal - 10"]
}
```

**`terminal`**: um comando e a saída dele. `tone`: `ok` (verde), `fail` (vermelho) ou `dim` (apagado).

```json
{ "type": "terminal", "command": "node --test", "lines": [{ "text": "✔ sem cupom, o preço não muda", "tone": "ok" }] }
```

**`quote`**: uma frase de efeito. `\n` quebra a linha.

```json
{ "type": "quote", "text": "Teste passando prova o que você testou.\nNão o que você esqueceu." }
```

**`chart`**: as curvas de custo da mudança (`healthy`, `rotten`).

```json
{ "type": "chart", "xAxisLabel": "tempo", "yAxisLabel": "custo da mudança", "curves": ["healthy", "rotten"] }
```

**`symptoms`**: uma lista de sintomas. `shown` diz quantos aparecem e `focus` (opcional) destaca um deles.

```json
{
  "type": "symptoms",
  "items": [{ "name": "Rigidez", "description": "Uma mudança pequena puxa outras cinco." }, { "name": "Fragilidade", "description": "Mexe aqui, quebra lá longe." }],
  "shown": 2,
  "focus": 1
}
```

**`graph`**: caixas ligadas por setas. `x` e `y` vão de 0 a 100. `tone`: `core`, `infrastructure`, `interface`,
`soft`. Uma seta `bad` fica vermelha, e com `focusOnBad` as outras ficam apagadas.

```json
{
  "type": "graph",
  "nodes": [{ "id": "checkout", "label": "Checkout", "x": 25, "y": 30, "tone": "core" }, { "id": "email", "label": "E-mail", "x": 75, "y": 70, "tone": "infrastructure" }],
  "edges": [{ "from": "checkout", "to": "email", "bad": true }],
  "focusOnBad": true
}
```

**`versus`**: o jeito errado ao lado do certo.

```json
{ "type": "versus", "wrong": { "title": "Checkout conhece o SMTP", "text": "Trocar de provedor quebra tudo." }, "right": { "title": "Checkout conhece uma porta", "text": "O provedor muda e nada quebra." } }
```

**`table`**: uma tabela. `shownRows` revela as linhas aos poucos. `highlightedColumn` e `highlightedRow` destacam uma
coluna e uma linha (índices a partir de 0).

```json
{
  "type": "table",
  "title": "Quem muda junto",
  "columns": ["Checkout", "Frete"],
  "rows": [{ "label": "Trocar o SMTP", "cells": ["✕", "✓"] }, { "label": "Nova regra de frete", "cells": ["✓", "●"] }],
  "highlightedColumn": 0
}
```

**`talk`**: só os apresentadores conversando, sem conteúdo.

```json
{ "type": "talk" }
```

## 9. Legendas

O texto da legenda é sempre o `text` da fala, com os colchetes removidos. Não é o que o reconhecimento de voz ouviu.
`output/captions.srt` traz as mesmas falas, com o nome de quem fala.

- **`words`**: palavra por palavra, em letras grossas, com a palavra falada destacada em amarelo. Fica no terço de
  baixo da tela, como nos vídeos curtos. É o padrão de `story`.
- **`blocks`**: blocos de até 90 caracteres numa faixa escura, um bloco por vez. É o padrão de `lesson`.

```json
{ "format": "story", "captionStyle": "words" }
{ "format": "lesson", "captionStyle": "blocks" }
```

## 10. Dicas

- Escreva falas curtas. Em 9:16 cabem poucas palavras por linha de legenda, e o `check` avisa quando não cabe.
- Declare uma `scene` nova para cada mudança de lugar, de câmera ou de HUD. A fala seguinte continua nela.
- Rode `check` sempre antes do `produce`: ele é rápido e não gera nada.
- Uma voz soa estranha? Ajuste o `style`, reescreva a frase ou use `pronunciation`. Só a fala alterada é gerada de novo.
  Nos exemplos, `"pronunciation": "... cúpom ..."` fez as vozes dizerem "cupom" direito.
- A voz recebe a fala sem os colchetes dos `[trechos]`. Não é preciso repetir o texto em `pronunciation` só para
  tirá-los: use `pronunciation` apenas quando a voz deve falar algo diferente da legenda.

---

## Para quem desenvolve o motor

- Camadas `domain`, `application`, `infrastructure` e `presentation`. A única exceção à regra das camadas é o ponto de
  composição, `src/presentation/cli/composition.ts` e as suas partes em `composition/`, imposta pelo dependency-cruiser.
- `npm run verify` roda typecheck, lint (ESLint + dependency-cruiser) e testes. As regras de Object Calisthenics e
  SOLID são impostas pelo ESLint. Uma exceção só vale com `// calisthenics-exceção: <motivo>`.
- Node >= 22.18 roda o TypeScript direto: só sintaxe apagável, e os imports levam a extensão `.ts`/`.tsx`.
- O código fica em inglês (identificadores, arquivos, chaves dos JSON do projeto, subcomandos). Os textos que a pessoa
  usuária vê ficam em pt-BR.
- Render: `@remotion/bundler` e `@remotion/renderer` chamados direto (sem `npx`). A pasta pública do render é
  temporária: os sons de `public/sounds/` (sintetizados por `giz sounds`) mais as vozes e as imagens de cenário do
  projeto, no mesmo caminho relativo.
- A voz Qwen3-TTS fica em `src/infrastructure/voice/qwen/` (tokenizador, embeddings, sessões ONNX, talker, code
  predictor). `QwenVoice` é carregada com `import()` só quando uma fala é gerada (`composition/voices.ts`): os outros
  comandos não carregam o onnxruntime. A GPU (`src/infrastructure/gpu/`) pré-carrega as bibliotecas da NVIDIA com
  `process.dlopen`; o ONNX Runtime 1.31.1 pede CUDA 13. O vocoder tenta a GPU e, na falha conhecida do nó `Pad` do
  export, passa para a CPU e fica lá.
- O pacote instala com `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install` (sem o provider CUDA, ~270 MB); o
  `giz setup` (ou `giz gpu install`) baixa o provider quando a GPU é escolhida.
- Ficha de um rig pelo Remotion: `npx remotion still src/presentation/remotion/index.ts CharacterSheet output/sheet-giz.png --props='{"rig":"giz"}'`.
  Acrescente `"character":"cast/<id>.json"` e `--public-dir=<projeto>` para usar os parâmetros de um personagem.
- Galeria de elencos prontos (uma por época), com os presets como pasta pública:
  `npx remotion still src/presentation/remotion/index.ts PresetSheet output/presets-past.png --props=casts/presets/sheets/past.json --public-dir=casts/presets`
  (troque `past` por `present`, `future` ou `creatures`). A composição `PresetSheet` lê os arquivos listados em `characters`.
  A ficha de uma criatura:
  `npx remotion still src/presentation/remotion/index.ts CharacterSheet output/sheet-zombie.png --props='{"rig":"giz","character":"creatures/zuzu.json"}' --public-dir=casts/presets`.
- Galeria de fundos (todos os fundos vetoriais em miniatura, uma folha por proporção):
  `npx remotion still src/presentation/remotion/index.ts BackgroundGallery output/backgrounds-16x9.png --props='{"aspect":"16:9"}'` e
  `npx remotion still src/presentation/remotion/index.ts BackgroundGallery output/backgrounds-9x16.png --props='{"aspect":"9:16"}'`.
  Uma cena pronta com personagens: monte as props do `ScenePreview` com a `scene` do preset, os `characters` e o
  `cast` (os `parameters` dos arquivos de `casts/presets/`), e rode
  `npx remotion still src/presentation/remotion/index.ts ScenePreview output/preview.png --frame=80 --props=<arquivo>.json`.
- O zod do core é a mesma versão que o Remotion fixa (4.6.7): com versões diferentes, o `remotion still` simples falha
  na verificação de versão.
- Um fundo novo: um arquivo em `src/presentation/scenes/scenario/backgrounds/` com as três camadas, a paleta em
  `src/domain/scenario/palettes/`, o nome em `VECTOR_BACKGROUNDS` (domínio) e no `backgroundRegistry`. Desenhe sobre o `backdrop` das camadas (horizonte,
  ponto de destaque, cantos com `CornerProps`) para o fundo valer nas duas proporções.
- `test/examples.test.ts` garante que os quatro exemplos carregam e passam no `check` sem erros.
