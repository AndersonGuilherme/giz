# Roteiro: Aula 01 · Como uma linha de código causou um desastre

> GERADO de `roteiro.ts` — edite lá e rode o build. 52 falas · 621 palavras · 29 cenas · duração 5:08 · uma cena nova a cada 11 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O desastre

**001** · 0:00 · **Téo** (surprised, raise) · Lia reage: concerned · tela: inbox

> [Três mil clientes] receberam uma confirmação de compra... sem comprar absolutamente nada.
>
> _voz:_ [Três mil clientes] receberam uma confirmação de compra... <pausa 0.25> sem comprar absolutamente nada!

**002** · 0:06 · **Lia** (surprised) · Téo reage: concerned · tela: (continua)

> Três mil? O que você mudou no sistema?

**003** · 0:10 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> Só o frete! Eu só queria mostrar o valor do frete no carrinho.

**004** · 0:14 · **Lia** (thinking, think) · Téo reage: skeptical · tela: código `cart-preview.ts`

> Então como [uma consulta de frete] disparou três mil e-mails?
>
> ⏸ 4s — "Leia o código"

**005** · 0:22 · **Téo** (skeptical) · Lia reage: happy · tela: (continua)

> É exatamente isso que eu quero descobrir.

**006** · 0:25 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> E a resposta explica por que um código que funciona perfeitamente começa a virar um pesadelo.

## 2 · O suspeito

**007** · 0:31 · **Lia** (skeptical, point) · tela: código `order-service.v1.ts`

> Esse é o suspeito: o OrderService. O checkout da loja.
>
> ⏸ 5s — "Leia o código"

**008** · 0:41 · **Téo** (neutral, point) · Lia reage: thinking · tela: (continua)

> Ele [soma os itens], [calcula o frete], [aplica o desconto], [salva o pedido] e [manda o e-mail].

**009** · 0:47 · **Lia** (skeptical) · Téo reage: happy · tela: (continua)

> Tudo isso num método só?

**010** · 0:49 · **Téo** (happy, shrug) · Lia reage: skeptical · tela: terminal

> E [funciona]! Os testes passam.

**011** · 0:52 · **Lia** (concerned, explain) · Téo reage: confused · tela: (continua)

> E esse é o perigo. Código funcionando não quer dizer código fácil de mudar.

**012** · 0:58 · **Lia** (happy, point) · Téo reage: excited · tela: symptoms

> Existem quatro sinais clássicos de que o design começou a travar o sistema. E esse código vai mostrar todos eles.

## 3 · Rigidez

**013** · 1:05 · **Téo** (neutral, explain) · Lia reage: neutral · tela: cartão "Frete expresso"

> Primeiro pedido do produto: frete expresso. Trinta e cinco reais, nunca grátis.

**014** · 1:11 · **Lia** (happy, point) · Téo reage: happy · tela: código `order-service.v2.ts` (novidades em verde vs `order-service.v1.ts`)

> Esse foi tranquilo: [uma linha no tipo], [outra no frete].
>
> ⏸ 7s — "Leia o código"

**015** · 1:23 · **Téo** (excited, raise) · Lia reage: skeptical · tela: cartão "Black Friday"

> Aí chegou a Black Friday. [Vinte por cento] pra todo mundo, [sem acumular com o VIP]... e [o e-mail precisa mostrar a economia].

**016** · 1:32 · **Lia** (skeptical, point) · Téo reage: neutral · tela: código `order-service.v3.ts` (novidades em verde vs `order-service.v2.ts`)

> [Olha] [o] [estrago] que [uma promoção] fez.
>
> ⏸ 8s — "Leia o código"

**017** · 1:42 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> Quatro pontos diferentes por causa de uma promoção?

**018** · 1:46 · **Lia** (happy, explain) · Téo reage: thinking · tela: symptoms

> Quando uma mudança simples obriga você a mexer em vários lugares, isso tem nome: [rigidez].

## 4 · Fragilidade

**019** · 1:52 · **Téo** (surprised, raise) · Lia reage: concerned · tela: terminal

> Pera aí... [o teste do frete grátis quebrou]!
>
> _voz:_ Pera aí... <pausa 0.3> [o teste do frete grátis quebrou]!

**020** · 1:56 · **Lia** (thinking, explain) · Téo reage: thinking · tela: cartão "Frete grátis"

> Primeiro, a regra da loja: [frete grátis quando o subtotal chega a duzentos reais], [antes de qualquer desconto]. E [esse pedido tem duzentos e dez].

**021** · 2:06 · **Téo** (excited, point) · Lia reage: happy · tela: código `order-service.v3.ts`

> Então por que cobrou frete? Consegue achar o problema?
>
> _voz:_ Então por que cobrou frete? <pausa 0.3> Consegue achar o problema?
>
> ⏸ 7s — "Ache o bug"

**022** · 2:18 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> Pra mostrar a economia, [o desconto passou a ser calculado antes do frete]. E [a linha do frete ficou idêntica]... só que agora ela lê cento e sessenta e oito, e não duzentos e dez.

**023** · 2:29 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> A linha nem mudou... e quebrou?
>
> _voz:_ A linha nem mudou... <pausa 0.25> e quebrou?

**024** · 2:32 · **Lia** (happy, explain) · Téo reage: surprised · tela: symptoms

> Mudou o que ela lê. Mexeu no desconto, quebrou o frete. Isso é [fragilidade].

## 5 · Imobilidade

**025** · 2:38 · **Lia** (skeptical, point) · Téo reage: excited · tela: inbox

> Agora, os três mil e-mails.

**026** · 2:41 · **Téo** (excited, celebrate) · Lia reage: happy · tela: (continua)

> Finalmente!

**027** · 2:42 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `cart-preview.ts`

> O carrinho só precisava de [um número]: o valor do frete.
>
> ⏸ 4s — "Leia o código"

**028** · 2:51 · **Lia** (concerned, point) · Téo reage: thinking · tela: graph

> Só que a regra de frete morava dentro do checkout. E o checkout [grava o pedido e manda o e-mail].

**029** · 2:57 · **Téo** (surprised, raise) · Lia reage: concerned · tela: (continua)

> Então, pra perguntar o frete... o carrinho criava um pedido de verdade?
>
> _voz:_ Então, pra perguntar o frete... <pausa 0.2> o carrinho criava um pedido de verdade?

**030** · 3:02 · **Lia** (concerned, explain) · Téo reage: surprised · tela: (continua)

> Com e-mail de confirmação e tudo. Você não consegue usar uma parte sem levar o resto junto.

**031** · 3:09 · **Téo** (happy, explain) · Lia reage: happy · tela: symptoms

> Isso é [imobilidade]. Agora os três mil e-mails fazem sentido.

## 6 · Viscosidade

**032** · 3:14 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `order-service.v4.ts` (novidades em verde vs `order-service.v3.ts`)

> Já sei! Coloco um parâmetro [dryRun]. Se estiver ligado, não salva e não manda e-mail.
>
> _voz:_ Já sei! <pausa 0.2> Coloco um parâmetro [dry run]. Se estiver ligado, não salva e não manda e-mail.
>
> ⏸ 9s — "Leia o código"

**033** · 3:29 · **Lia** (skeptical, point) · Téo reage: confused · tela: (continua)

> Resolve o problema de hoje. Mas olha o checkout: [mais um if], mais um caminho, mais uma combinação pra testar.

**034** · 3:38 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Mas foi muito mais rápido do que separar tudo!

**035** · 3:41 · **Lia** (happy, explain) · Téo reage: thinking · tela: symptoms

> E esse é o quarto sinal: [viscosidade]. Quando o atalho dá menos trabalho do que fazer certo.

**036** · 3:48 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E cada atalho deixa o próximo conserto mais difícil.

**037** · 3:52 · **Lia** (excited, point) · Téo reage: happy · tela: (continua)

> Exatamente.

## 7 · A lição

**038** · 3:53 · **Lia** (happy, explain) · Téo reage: happy · tela: symptoms

> Percebeu o padrão?

**039** · 3:55 · **Lia** (neutral, point) · tela: (continua)

> Rigidez: uma mudança te obriga a mexer em vários lugares.

**040** · 4:00 · **Téo** (neutral, point) · tela: (continua)

> Fragilidade: você muda uma coisa e quebra outra.

**041** · 4:04 · **Lia** (neutral, point) · tela: (continua)

> Imobilidade: não dá pra reaproveitar uma parte sem carregar o resto.

**042** · 4:09 · **Téo** (happy, point) · tela: (continua)

> Viscosidade: a gambiarra fica mais fácil que a solução bem feita.

**043** · 4:14 · **Téo** (excited, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Então a solução é reescrever tudo do zero?

**044** · 4:17 · **Lia** (thinking, explain) · Téo reage: confused · tela: versus

> Não necessariamente. Se você repetir as mesmas decisões, recria os mesmos problemas.

**045** · 4:23 · **Lia** (neutral, point) · Téo reage: thinking · tela: graph

> Por trás dos quatro sinais tem decisões de design: responsabilidades misturadas, dependências apontando pro lugar errado e regras que ninguém escreveu.

**046** · 4:33 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> É isso que o SOLID ensina a organizar. Porque código não apodrece porque envelhece. Apodrece quando cada mudança fica mais cara.
>
> _voz:_ É isso que o SOLID ensina a organizar. <pausa 0.4> Porque código não apodrece porque envelhece. <pausa 0.3> Apodrece quando cada mudança fica mais cara.

## 8 · Desafio

**047** · 4:43 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio pra você: [abre aquele arquivo] do seu projeto que ninguém gosta de mexer.

**048** · 4:48 · **Lia** (happy, explain) · tela: (continua)

> E [procura os quatro sinais] nele.

**049** · 4:51 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Achou mais de um? [Temos um caso pra investigar].

**050** · 4:55 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: coesão e acoplamento. As duas ideias que explicam de onde vêm esses sinais.

**051** · 5:02 · **Téo** (happy, explain) · Lia reage: happy · tela: Lia e Téo conversando

> Depois dessa, eu nunca mais olho pra um OrderService do mesmo jeito.

**052** · 5:06 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
