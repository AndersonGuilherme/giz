# giz nucleo

Motor de vídeos animados: você escreve um roteiro em JSON e o `giz` gera as vozes, anima os personagens, monta as
cenas e grava um MP4 com legendas. Este guia mostra como criar um projeto, explica cada campo do roteiro e dá um
exemplo de cada recurso. Os nomes dos campos e os valores fixos dos JSON ficam em inglês. Os textos que aparecem no
vídeo seguem o idioma do projeto.

Os exemplos completos estão em [`examples/`](examples/):

| Pasta | O que é |
|---|---|
| `examples/internet-story/pt-BR` e `en` | História 9:16 de ~60 s, "E se a internet parasse por 24 horas?", com narrador, dois personagens cabeça-bola, 6 fundos vetoriais, câmera, chuva, fogo, HUD e texto grande |
| `examples/coupon-lesson/pt-BR` e `en` | Aula 16:9 sobre um bug de cupom de desconto, com Lia e Téo, cartão, título, código, terminal, citação e desafio |

Use qualquer uma dessas pastas como ponto de partida: copie a pasta, troque os textos e rode `produce`.

---

## 1. Instalação

Precisa de Node 22.18 ou mais novo.

```bash
cd nucleo
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install
```

A voz local (Qwen3-TTS) usa a GPU e baixa o modelo na primeira vez. As configurações dela (pasta dos modelos, `cuda`
ou `cpu`) ficam no `giz.config.json` da raiz do repositório, que o `npm run setup` cria.

## 2. Criar um projeto

Um projeto é uma pasta com três coisas:

```
meu-video/
├── project.json        o perfil do vídeo (formato, idioma, proporção, elenco, voz)
├── script.json         o roteiro: capítulos e falas, cada fala com sua cena
└── cast/
    ├── narrator.json   um arquivo por personagem; o nome do arquivo é o id
    └── nina.json
```

O `giz` cria sozinho, dentro da pasta:

- `voice/`: as vozes geradas, uma por fala (`<id>.wav` e as palavras com tempo). Só as falas que mudaram são geradas de novo.
- `output/`: `video.mp4`, `captions.srt` e, com `build`, `props.json`.
- `recordings/`: você cria esta pasta só se for gravar a própria voz (veja `voice.provider`).

`voice/` e `output/` não vão para o git.

Passo a passo:

1. Copie um exemplo: `cp -r examples/internet-story/pt-BR ../meu-video`.
2. Edite `project.json`, os personagens em `cast/` e as falas em `script.json`.
3. Rode `node src/presentation/cli/giz.ts check ../meu-video` até dar `0 erro(s)`.
4. Rode `node src/presentation/cli/giz.ts produce ../meu-video`.

## 3. Comandos

Todos rodam dentro de `nucleo/`: `node src/presentation/cli/giz.ts <comando> <pasta-do-projeto>`.

| Comando | O que faz |
|---|---|
| `check <pasta>` | Valida os JSON e confere cada fala: texto que não cabe, caixas sobrepostas, algo fora da área segura, número de `[trechos]` diferente do número de `beats`, personagem fora do elenco. Sai com código 1 se houver erro. |
| `voice <pasta>` | Gera as vozes que faltam ou que mudaram e alinha as palavras (Whisper). |
| `build <pasta>` | Monta a linha do tempo e grava `output/props.json`. |
| `render <pasta>` | Renderiza `output/video.mp4` e `output/captions.srt` com as vozes que já existem. |
| `produce <pasta>` | Faz tudo em ordem: `check`, vozes, linha do tempo, render e legendas. Para no primeiro erro do `check`. |
| `sheet <rig> [personagem.json]` | Desenha a ficha de um rig (poses, expressões, bocas) em `output/sheet-<nome>.png`. |

Exemplos:

```bash
node src/presentation/cli/giz.ts check examples/coupon-lesson/pt-BR
node src/presentation/cli/giz.ts produce examples/internet-story/en
node src/presentation/cli/giz.ts sheet ball-head examples/internet-story/pt-BR/cast/nina.json
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
  "cast": ["narrator", "nina", "davi"],
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
| `voice.provider` | sim | `qwen`, `recording` | `qwen`: voz local gerada na GPU. `recording`: você grava cada fala em `recordings/<id-da-fala>.wav`. |
| `voice.model` | não | `0.6b`, `1.7b` | O modelo Qwen. O `1.7b` é mais natural e é o único que segue o `style` da voz. Sem ele, vale o `giz.config.json`. |

## 5. Personagens (`cast/<id>.json`)

```json
{
  "id": "nina",
  "name": "Nina",
  "rig": "ball-head",
  "parameters": { "outfit": "dress", "outfitColor": "#d0573f", "hair": "bun", "accessoryColor": "#f2d16b" },
  "voice": {
    "id": "serena",
    "style": "Fale em português do Brasil, com sotaque brasileiro, de forma expressiva e natural, como uma jovem esperta"
  },
  "personality": "prática e curiosa",
  "defaultExpression": "neutral"
}
```

| Campo | Obrigatório | Para que serve |
|---|---|---|
| `id` | sim | O mesmo nome do arquivo, em minúsculas. É o que o roteiro usa em `speaker` e `characters`. |
| `name` | sim | O nome que aparece na legenda do `.srt`. |
| `rig` | não | O desenho do corpo (seção 6). Sem `rig`, o personagem é só voz, como um narrador, e não pode entrar em cena. |
| `parameters` | não | A aparência, conforme o rig. Os que faltam usam o padrão do rig. |
| `voice.id` | sim | A voz Qwen: `serena`, `vivian`, `uncle_fu`, `ryan`, `aiden`, `ono_anna`, `sohee`, `eric` ou `dylan`. As mesmas vozes falam pt-BR e inglês (o idioma vem do projeto). |
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

### `ball-head` (cabeça-bola)

Cabeça redonda escura e corpo simples, no estilo dos vídeos curtos de curiosidade.

| Parâmetro | Tipo | Padrão | Valores |
|---|---|---|---|
| `headColor` | cor | `#151515` | qualquer `#rrggbb` |
| `shine` | sim/não | `true` | o brilho na cabeça |
| `outfit` | opção | `tshirt` | `tshirt`, `tunic`, `dress`, `hoodie` |
| `outfitColor` | cor | `#3f6fb5` | |
| `hair` | opção | `none` | `none`, `bun`, `short`, `scarf`, `hat` |
| `accessoryColor` | cor | `#e8d9b5` | a cor do lenço, do chapéu ou do coque |
| `glasses` | sim/não | `false` | |
| `eyeScale` | número | `1` | de `0.8` a `1.4` |

```json
{ "rig": "ball-head", "parameters": { "outfit": "hoodie", "outfitColor": "#2f7f6f", "hair": "short", "glasses": true } }
```

### `lia-style` (estilo Lia)

Personagem de moletom com cabelo em degradê, como os apresentadores das aulas.

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
| `scene` | não | seção 8 | A cena que começa nesta fala. Sem `scene`, a fala continua na cena anterior. A primeira fala precisa ter uma. |
| `beats` | não | lista | Uma mudança para cada `[trecho]` do texto, na mesma ordem. Veja abaixo. |
| `holdAfter` | não | `{ "seconds": 3, "label": "Ache o bug" }` | Uma pausa depois da fala, para quem assiste pensar, marcada por um tique a cada segundo. |
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
  "speaker": "davi",
  "text": "Como é que eu pago o ônibus? Meu cartão mora no celular!",
  "pose": "hand-on-head",
  "expression": "scared",
  "look": "camera",
  "reaction": { "expression": "skeptical" }
}
```

Uma pronúncia diferente da legenda:

```json
{ "text": "Sem sinal. Sem Wi-Fi.", "pronunciation": "Sem sinal. Sem uai-fai." }
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
  "characters": [{ "character": "nina", "position": "left" }, { "character": "davi", "position": "right" }],
  "camera": { "type": "shake", "intensity": 1.2 },
  "effects": [{ "type": "rain" }, { "type": "vignette" }],
  "hud": { "fields": [{ "label": "HORA", "value": "3" }, { "label": "SEM", "value": "SINAL" }], "bar": { "label": "pânico", "value": 40 } },
  "highlight": { "text": "E SE A INTERNET PARASSE?" }
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
{ "character": "davi", "position": { "x": 0.62, "y": 0.78 }, "scale": 0.9, "direction": "left" }
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
| `village` | vila ao pôr do sol |

`colors` troca cores da paleta, uma a uma. Os nomes ficam no começo de cada arquivo em
`src/presentation/scenes/scenario/backgrounds/` (por exemplo `skyTop`, `skyBottom` e `window` na `street`).

```json
{ "background": { "vector": "street", "colors": { "skyTop": "#0b1230", "skyBottom": "#3a2a5a" } } }
```

Uma imagem própria fica dentro da pasta do projeto e deve ter a proporção do vídeo. Se o arquivo não existir, o
`check` avisa e o vídeo usa o fundo vetorial (o `vector` dado ou `room`):

```json
{ "background": { "image": "images/praia.png", "vector": "field" } }
```

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
{ "camera": { "type": "follow", "target": "nina" } }
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
- Hoje a voz recebe o texto com os colchetes dos `[trechos]`, e isso deixa a fala lenta e cheia de pausas. Numa fala
  com beats, repita o texto sem colchetes em `pronunciation`: os beats continuam saindo dos trechos do `text`.

---

## Para quem desenvolve o motor

- Camadas `domain`, `application`, `infrastructure` e `presentation`. A única exceção à regra das camadas é
  `src/presentation/cli/composition.ts`, imposta pelo dependency-cruiser.
- `npm run verify` roda typecheck, lint (ESLint + dependency-cruiser) e testes. As regras de Object Calisthenics e
  SOLID são impostas pelo ESLint. Uma exceção só vale com `// calisthenics-exceção: <motivo>`.
- Node >= 22.18 roda o TypeScript direto: só sintaxe apagável, e os imports levam a extensão `.ts`/`.tsx`.
- O código fica em inglês (identificadores, arquivos, chaves dos JSON do projeto, subcomandos). Os textos que a pessoa
  usuária vê ficam em pt-BR.
- Render: `@remotion/bundler` e `@remotion/renderer` chamados direto (sem `npx`). A pasta pública do render é
  temporária: os sons de `public/sounds/` (copiados de `motor/assets/sfx/`) mais as vozes do projeto.
- Ficha de um rig pelo Remotion: `npx remotion still src/presentation/remotion/index.ts CharacterSheet output/sheet-ball-head.png --props='{"rig":"ball-head"}'`.
  Acrescente `"character":"cast/<id>.json"` e `--public-dir=<projeto>` para usar os parâmetros de um personagem.
- `test/examples.test.ts` garante que os quatro exemplos carregam e passam no `check` sem erros.
