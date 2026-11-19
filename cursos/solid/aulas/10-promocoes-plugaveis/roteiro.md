# Roteiro: Aula 10 · Dia das Mães sem editar uma linha do cálculo

> GERADO de `roteiro.ts` — edite lá e rode o build. 49 falas · 747 palavras · 18 cenas · duração 5:16 · uma cena nova a cada 18 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A aposta

**001** · 0:00 · **Téo** (excited, raise) · Lia reage: happy · tela: cartão "Pedido do marketing"

> O Dia das Mães entra no ar na segunda. E a Lia me fez uma aposta.

**002** · 0:05 · **Lia** (happy, point) · Téo reage: skeptical · tela: (continua)

> Colocar essa promoção no ar sem editar uma linha do cálculo de preço. E com teste provando.

**003** · 0:11 · **Téo** (skeptical, shrug) · Lia reage: happy · tela: (continua)

> Zero linhas? Até a aula passada, cada promoção era um else if novo.
>
> _voz:_ Zero linhas? Até a aula passada, cada promoção era um élse ífi novo.

**004** · 0:16 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Pra ganhar essa aposta, o ponto de extensão da aula passada precisa aguentar uma promoção bem diferente das outras.

## 2 · O cupom

**005** · 0:24 · **Téo** (thinking, explain) · Lia reage: thinking · tela: cartão "Antes do Dia das Mães"

> Só que, antes do Dia das Mães, chegou um cupom: vinte e cinco reais de desconto, valor fixo.

**006** · 0:30 · **Lia** (thinking, raise) · Téo reage: confused · tela: (continua)

> Pergunta rápida. Vinte e cinco reais é mais que dez por cento de VIP?
>
> _voz:_ Pergunta rápida. <pausa 0.2> Vinte e cinco reais é mais que dez por cento de vípi?
>
> ⏸ 3s — "Pense"

**007** · 0:38 · **Téo** (surprised, think) · Lia reage: happy · tela: (continua)

> Depende do pedido! Em cem reais, o cupom ganha. Em quatrocentos, o VIP dá quarenta.
>
> _voz:_ Depende do pedido! Em cem reais, o cupom ganha. Em quatrocentos, o vípi dá quarenta.

**008** · 0:45 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Então comparar taxas não funciona mais. Pra saber qual é o maior desconto, tem que comparar dinheiro.

## 3 · O contrato

**009** · 0:52 · **Lia** (happy, point) · Téo reage: thinking · tela: código `discount-rule.ts`

> Por isso o contrato mudou. [Cada regra devolve quanto desconta, em centavos]. E ganhou [um nome], que vai pro e-mail de confirmação.
>
> ⏸ 4s — "Leia o código"

**010** · 1:05 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Pera aí. Mudar o contrato não é justamente modificar?

**011** · 1:10 · **Lia** (concerned, shrug) · Téo reage: surprised · tela: (continua)

> É, e custou: as três regras antigas tiveram que ser adaptadas. Mexer no contrato mexe em todo mundo que o cumpre.

**012** · 1:18 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Por isso o contrato é a parte que vale acertar cedo. A gente aprendeu, com o cupom, que taxa era pouco.

**013** · 1:25 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> E o código do cupom [entrou como campo opcional]. Quem não usa nem percebe.

**014** · 1:30 · **Lia** (happy, point) · Téo reage: thinking · tela: código `rules.ts`

> E as regras ficaram assim: cada uma decide sozinha [se vale] e [quanto desconta].
>
> ⏸ 6s — "Leia o código"

**015** · 1:42 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> E o cupom é [uma função que fabrica a regra]. O código e o valor chegam de fora.

**016** · 1:48 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Então o cupom do mês que vem nem é regra nova. É a mesma, com outro código.

## 4 · A calculadora

**017** · 1:53 · **Lia** (happy, point) · Téo reage: thinking · tela: código `price-calculator.nocap.ts`

> E a calculadora? Ela [pergunta pra cada regra] e [guarda a maior, com o nome].
>
> ⏸ 5s — "Leia o código"

**018** · 2:03 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E se der empate? Dez reais de VIP contra um cupom de dez.
>
> _voz:_ E se der empate? Dez reais de vípi contra um cupom de dez.

**019** · 2:08 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> O sinal é maior, não maior ou igual. Então o empate fica com a primeira da lista. Isso também é regra, e tem teste.

## 5 · O teto

**020** · 2:16 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> E se o cliente usar o cupom de vinte e cinco num pedido de vinte?
>
> ⏸ 3s — "Pense"

**021** · 2:24 · **Lia** (concerned, point) · Téo reage: surprised · tela: terminal

> [O desconto passa do pedido]. O total fica negativo: a loja pagaria cinco reais pro cliente levar.

**022** · 2:31 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E onde entra a correção? No cupom?

**023** · 2:34 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Pensa no Dia das Mães, no próximo cupom, em qualquer regra futura. Todas precisam desse limite?

**024** · 2:41 · **Téo** (happy, point) · Lia reage: happy · tela: código `price-calculator.ts` (novidades em verde vs `price-calculator.nocap.ts`)

> Todas. Então é regra da parte estável: [o desconto nunca passa do subtotal].
>
> ⏸ 3s — "Leia o código"

**025** · 2:51 · **Téo** (skeptical, shrug) · Lia reage: happy · tela: (continua)

> Só que isso foi editar a calculadora.

**026** · 2:53 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Foi corrigir um bug na regra que vale pra todas. Lembra da aula passada? Fechado não é congelado.

## 6 · Dia das Mães

**027** · 3:01 · **Lia** (excited, point) · Téo reage: excited · tela: código `mothers-day.ts`

> Agora sim, a aposta. O Dia das Mães é [um arquivo novo]: [quinze por cento], de quatro a dez de maio.
>
> ⏸ 4s — "Leia o código"

**028** · 3:12 · **Téo** (thinking, point) · Lia reage: happy · tela: (continua)

> E o [fim é dia onze, sem incluir], pra valer o domingo inteiro.

**029** · 3:16 · **Téo** (happy, point) · Lia reage: thinking · tela: código `store.ts` (novidades em verde vs `store.v1.ts`)

> E pra ligar a promoção, [ela entra na lista]. Essa é a linha que mudou.
>
> ⏸ 3s — "Leia o código"

**030** · 3:24 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Ih. Então eu perdi a aposta? Mexi numa linha.

**031** · 3:28 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> No cálculo, zero. Essa linha fica no arquivo que monta a loja, que existe justamente pra mudar quando a loja muda.

**032** · 3:36 · **Lia** (thinking, explain) · Téo reage: happy · tela: (continua)

> Fechado nunca quis dizer zero linhas no sistema inteiro. Quer dizer que a mudança cai no lugar certo.

**033** · 3:43 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> E [a prova].

**034** · 3:44 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> Repara no primeiro: cada regra se testa sozinha. Sem calculadora, sem banco, sem esperar maio chegar.

**035** · 3:51 · **Téo** (happy, think) · Lia reage: happy · tela: (continua)

> E no último: o mesmo VIP leva dez antes e quinze depois. O funcionário continua com trinta.
>
> _voz:_ E no último: o mesmo vípi leva dez antes e quinze depois. O funcionário continua com trinta.

**036** · 3:59 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> E se o marketing pedir: Dia das Mães não vale pra quem usou cupom?

**037** · 4:04 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> A regra olha o contexto, que já tem o cupom. O que ela não pode é perguntar pras outras regras.

**038** · 4:10 · **Lia** (concerned, explain) · Téo reage: concerned · tela: (continua)

> No dia em que uma peça conhece a outra, adicionar uma promoção volta a mexer nas vizinhas.

## 7 · A lição

**039** · 4:16 · **Lia** (happy, explain) · Téo reage: thinking · tela: versus

> Compara as duas. Antes, cada promoção editava o cálculo. Agora, promoção é uma peça: arquivo novo e uma linha na lista.

**040** · 4:25 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E o que sobrou na calculadora foi só o que vale pra todas.

**041** · 4:29 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "O que fica na calculadora"

> [Vale o maior], [nunca passa do subtotal], [empate fica com a primeira]. Isso é a política. O resto é peça.

**042** · 4:37 · **Lia** (excited, point) · Téo reage: excited · tela: quote

> E é isso que torna a promoção plugável: a política fica no centro, e as promoções entram pela borda.

**043** · 4:44 · **Téo** (excited, celebrate) · Lia reage: happy · tela: (continua)

> Então eu ganhei a aposta.

**044** · 4:46 · **Lia** (happy, shrug) · Téo reage: happy · tela: (continua)

> Ganhou. Zero linhas no cálculo, e seis testes pra provar.

## 8 · Desafio

**045** · 4:51 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [escreve a regra leve três, pague dois].

**046** · 4:55 · **Lia** (thinking, explain) · tela: (continua)

> [O contexto de hoje tem o que ela precisa]? [Se não tem, o que muda no contrato], e quem sente essa mudança?

**047** · 5:02 · **Téo** (thinking, raise) · Lia reage: happy · tela: cartão "Próxima aula"

> Agora, cada regra é um objeto com um nome e uma função dentro. Será que precisa mesmo de objeto?

**048** · 5:08 · **Lia** (excited, point) · Téo reage: excited · tela: (continua)

> Na próxima aula: o mesmo princípio só com funções. E até com uma tabela.

**049** · 5:14 · **Téo** (excited, wave) · Lia reage: happy, wave · tela: Lia e Téo conversando

> Até lá!
