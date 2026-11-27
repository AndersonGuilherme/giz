# Guia do formato aula (pt-BR)

Uma aula é um **episódio de investigação**: um mistério aparece no começo e é resolvido aos poucos, pista por pista.
Vale para programação, matemática, história ou culinária: muda o mistério, não o formato. Os apresentadores (no
máximo 2 com corpo, por padrão Lia e Téo, `lia` e `teo`) ficam ao lado do conteúdo, que ocupa as cenas de aula
(`title`, `card`, `code`, `terminal`, `quote`, `chart`, `symptoms`, `graph`, `versus`, `table`, `inbox`, `talk`).
Uma cena `scenario` com os dois pode abrir e fechar a aula.

## Estrutura

Os tempos abaixo valem para ~5 min; numa aula mais curta, use menos pistas (no mínimo uma) e encurte cada parte.

| Capítulo | Parte do tempo | Função | Cena típica |
|---|---|---|---|
| O desastre | primeiros ~8% | Gancho: o problema aparece em até 8 s e vira uma pergunta | `card` (`ticket`), `inbox`, `scenario`, `title` |
| O suspeito | ~15% | O objeto de estudo e por que ele "parece certo" | `code`, `terminal` com testes passando |
| As pistas | ~50% | Cada pista é um conceito, descoberto num caso concreto | `code`, `terminal`, `card`, `graph`, `table` |
| A pausa | dentro de uma pista | Quem assiste tenta achar antes da revelação | `holdAfter` de 2 a 3 s ("Ache o bug") |
| A lição | ~15% | O padrão por trás das pistas e a frase-chave (uma vez) | `symptoms`, `versus`, `quote` |
| Desafio | últimos ~7% | Um exercício para agora e o gancho da próxima aula | `card` (`challenge`, `next`), `talk` |

- `chapters`: os nomes curtos dos capítulos, em ordem; os capítulos de pistas podem ser vários.
- O mistério do começo é fechado explicitamente no fim ("agora o cupom faz sentido").

## Didática

- Um conceito central por aula; as pistas são facetas dele.
- Todo conceito aparece primeiro num caso concreto e só depois ganha nome ("isso tem nome: **rigidez**").
- Uma descoberta a cada 10 a 20 s: troca de cena, revelação, teste falhando ou passando.
- Varie o gancho: um incidente, uma pergunta polêmica, um desafio, um número surpreendente, um "e se…".
- Rigor: toda regra usada no raciocínio é dita. Causas são causas comuns, não únicas. Caso inventado leva o aviso
  "Cenário simulado para fins didáticos" na tela (por exemplo, o `note` do `inbox`).

## Ritmo

- A voz Qwen em pt-BR fala cerca de **1,8 palavras por segundo**, pausas incluídas: 60 s ≈ 108 palavras,
  5 min ≈ 540 palavras. Some as palavras de todas as falas e fique a até 10% do alvo. As pausas de leitura do código
  e os `holdAfter` contam à parte.
- Falas curtas, até 2 frases. Uma fala longa de quem explica é seguida de uma reação curta do outro.
- Código novo na tela ganha uma pausa de leitura automática (4 a 9 s). Não narre por cima: a fala seguinte traz a
  consequência. Código com até ~20 linhas curtas.

## Diálogo

- Dois profissionais, não professora e aluno: quem pergunta tem boas ideias e às vezes escolhe a solução que parece
  certa; quem explica também é desafiado e pode dizer "depende".
- Falado, não escrito: "Percebeu o padrão?", "Pera aí…". Não leia o código linha a linha.
- Quem escuta reage (`reaction`); o olhar tem intenção (`look`: `camera` quando fala com quem assiste, `other` com o
  colega, `content` para a cena). Pergunta para quem assiste é `look: "camera"`.
- Frase-chave uma vez só, no fim. Nada de piada que depende de meme do momento.
- Movimento contido: `explain`, `point`, `think`, `neutral` e as expressões `happy`, `neutral`, `thinking`; `surprised`,
  `worried` e `confused` só quando a fala pede; `celebrate` e `excited` quase nunca. A mesma expressão no máximo 3
  falas seguidas.

## Cenas e beats

- Use os `[trechos]` e os `beats` para revelar itens (`shown`), destacar linhas do código (`highlight`) ou mostrar a
  saída do terminal (`lines`). O número de `[trechos]` é igual ao número de `beats`.
- `terminal`: linhas de até ~52 caracteres, com `tone` `ok`, `fail` ou `dim`.
- `table`: `columns` são só as colunas das células (a coluna do `label` não tem cabeçalho).
- `graph`: nós vizinhos à esquerda, à direita ou na diagonal; nós alinhados na vertical e próximos escondem a seta.

## Voz e pronúncia

- Termos em inglês e nomes de código: o nome técnico em `text` e a forma falada em `pronunciation`
  ("checkout" → "chéc-áuti", `dryRun` → "drai ran"). Prefira o termo em português quando existir.
- Números: dígitos em `text`, por extenso em `pronunciation` ("R$ 10" → "dez reais").
- Siglas soltas embolam ("IA" → "inteligência artificial" em `pronunciation`).
- Perguntas curtas, com a palavra-chave no fim, ou com marcador ("Será que…?", "…, né?").

## Originalidade

O mistério, os exemplos, as falas e qualquer personagem novo são originais. Nunca imite, copie ou cite um vídeo,
canal, criador, curso, série ou personagem específico que já exista.
