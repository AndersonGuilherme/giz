# Guia do formato história (pt-BR)

Uma história curta animada: cenários (`scenario`) com personagens desenhados, um narrador opcional (só voz) e
legenda palavra por palavra. Serve para "E se…?", curiosidades, pequenas comédias e lendas inventadas.

## Estrutura

Divida a duração-alvo nestas partes (os tempos são proporcionais):

| Parte | Parte do tempo | O que acontece |
|---|---|---|
| Gancho | primeiros 3 s | Uma pergunta, uma situação absurda ou um número surpreendente que já mostra o problema. |
| Situação | até ~20% | Quem são os personagens e qual é a regra deste mundo. |
| Escalada | ~50% | De 2 a 4 viradas, cada uma com consequência maior que a anterior, cada uma numa cena nova. |
| Clímax | ~15% | O pior momento ou a grande surpresa. |
| Fecho | últimos ~15% | A resolução, curta, e uma frase final que fica (ou uma pergunta para quem assiste). |

- `chapters`: de 3 a 6 nomes curtos que marcam o avanço ("Hora 0", "Hora 3", "O plano", "O fim").
- O mistério ou a pergunta do gancho é respondido no fecho.

## Um bom gancho

- Concreto e visual em até 3 s: "Imagine: a internet do mundo inteiro desliga por um dia."
- Cria uma pergunta que só o fim responde. Nunca comece com "Olá, hoje vamos falar de…".
- A primeira fala, com até 6 palavras, entrega o gancho; o `highlight` (até 4 palavras, em MAIÚSCULAS) e a câmera
  `zoom-in` da `scene` dela o tornam visual na hora.

## Ritmo

- A voz Qwen em pt-BR fala cerca de **1,8 palavras por segundo**, pausas incluídas: 30 s ≈ 54 palavras,
  60 s ≈ 108 palavras. Some as palavras de todas as falas e fique a até 10% do alvo.
- Falas curtas: até ~10 palavras. Uma fala mais longa precisa de um `beat` ou de uma mudança de câmera no meio.
- O `text` é legenda: curto. O que a voz diz por extenso (números, siglas, nomes) vai em `pronunciation`.
- Uma cena nova a cada 5 a 10 s (a cada 1 a 3 falas). A tela nunca fica parada mais de ~6 s sem uma mudança
  (cena, câmera, reação, HUD, texto grande).

## Ofício

- Cada personagem quer alguma coisa, e algo está em jogo: diga isso cedo ("se o gato não comer, ele processa a gente").
- Plante e colha: um detalhe do começo volta no fim (callback) e paga a espera.
- Feche com uma virada ou um arremate: uma última fala curta e inesperada depois da resolução.

## Tom e diálogo

- Falado, não escrito: "Pera aí…", "Olha o estrago", nada de "Neste vídeo veremos…".
- O humor vem da situação e da personalidade de cada personagem (use a `personality` dos personagens prontos).
- Não descreva o que a tela já mostra: aponte a consequência.
- Uma fala longa é seguida de uma reação curta de outro personagem.

## Personagens

- No máximo 2 personagens com corpo na mesma cena em 9:16 e 3 em 16:9. Quem fala (menos o narrador) está em cena.
- O narrador é um personagem sem `rig` (id `narrator`), com voz e `defaultExpression: "neutral"`.
- Personagem novo: use um rig e só os parâmetros listados. O `voice.style` em pt-BR começa com
  "Fale em português do Brasil, com sotaque brasileiro, …".
- Movimento contido: gesto forte (`celebrate`, `hand-on-head`, `hands-on-mouth`) só no pico de emoção. No resto,
  `explain`, `point`, `think` ou `neutral`, com `happy`, `neutral` ou `thinking`. A mesma expressão no máximo 3 falas
  seguidas.
- Quem escuta reage: preencha `reaction` nas falas importantes. Use `look` com intenção (`camera` quando fala com
  quem assiste, `other` com o colega).

## Cenas

- Toda cena é `scenario`. Use um fundo vetorial (`background.vector`) ou copie uma cena pronta e preencha `characters`.
- Câmera variada: `zoom-in` no gancho, `follow` para quem fala, `pan` em passagem de tempo, `shake` só em tensão.
- Efeitos com moderação (`rain`, `snow`, `fire`, `vignette`, `tint`) e sempre a serviço do momento.
- `hud` para contadores que mudam (hora, dia, nível de pânico); declare a cena de novo para mudar o valor.
- `highlight`: até 4 palavras. Nenhum texto pode sair da área segura: textos curtos cabem.

## Voz e pronúncia

- Siglas e palavras em inglês vão escritas normalmente em `text` e com a grafia falada em `pronunciation`
  ("Wi-Fi" → "uai-fai"). Prefira a palavra em português quando existir.
- Números: dígitos em `text` e por extenso em `pronunciation` quando a leitura for ambígua.
- Perguntas curtas, com a palavra-chave no fim ("Tudo isso num dia só?"), ou com marcador ("Será que…?", "…, né?").
- O número de `[trechos]` do texto é igual ao número de `beats`. Use beats só quando algo muda no meio da fala.

## Originalidade

A história, os personagens, as falas e as piadas são originais. Nunca imite, copie ou cite um vídeo, canal,
criador, série, filme, jogo ou personagem específico que já exista.
