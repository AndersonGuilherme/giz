# Roteiro: Aula 13 · Um quadrado é um retângulo?

> GERADO de `roteiro.ts` — edite lá e rode o build. 48 falas · 735 palavras · 20 cenas · duração 5:32 · uma cena nova a cada 17 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A pergunta

**001** · 0:00 · **Lia** (happy, raise) · Téo reage: thinking, think · tela: quote

> Pergunta rápida, sem pensar muito: um quadrado é um retângulo?
>
> _voz:_ Pergunta rápida, <pausa 0.2> sem pensar muito: <pausa 0.2> um quadrado é um retângulo?
>
> ⏸ 3s — "Sim ou não?"

**002** · 0:08 · **Téo** (happy, shrug) · Lia reage: skeptical · tela: (continua)

> Claro que é. Quatro ângulos retos, aprendi na escola.

**003** · 0:12 · **Lia** (skeptical, point) · Téo reage: surprised · tela: terminal

> Na geometria, sim. Agora olha o código que acredita nisso: [área dezesseis], quando o teste esperava vinte.

**004** · 0:20 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Hoje começa o L do SOLID. E a gente vai descobrir por que herdar não basta, e o que isso tem a ver com o cartão-presente da loja.

## 2 · O retângulo

**005** · 0:29 · **Lia** (happy, point) · Téo reage: thinking · tela: código `rectangle.ts`

> O retângulo tem largura e altura. O quadrado herda dele.
>
> ⏸ 7s — "Leia o código"

**006** · 0:41 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E pra continuar quadrado, cada setter muda os dois lados. Parece certo. Então por que deu dezesseis?
>
> _voz:_ E pra continuar quadrado, cada sétter muda os dois lados. <pausa 0.2> Parece certo. <pausa 0.2> Então por que deu dezesseis?
>
> ⏸ 4s — "Ache o bug"

**007** · 0:52 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> Mudar a altura pra quatro [também mudou a largura]. [Quatro vezes quatro], dezesseis.

**008** · 0:58 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Mas o quadrado não fez nada de errado. Ele é um quadrado!

**009** · 1:02 · **Lia** (thinking, point) · Téo reage: thinking · tela: (continua)

> Cada classe, sozinha, está certa. O que quebrou foi [uma promessa do retângulo]: mudar a largura não mexe na altura.

**010** · 1:10 · **Téo** (skeptical) · Lia reage: concerned · tela: (continua)

> Uma promessa que nem está no tipo. É um comentário.

**011** · 1:15 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> E é aí que mora o perigo. O compilador confere se os métodos existem. Se eles cumprem a promessa, ninguém confere.

## 3 · Na loja

**012** · 1:23 · **Téo** (happy, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Tá, mas quadrado eu nunca vendi.

**013** · 1:26 · **Lia** (happy, explain) · Téo reage: thinking · tela: cartão "O contrato de Payment"

> Pagamento você vende todo dia. Todo pagamento da loja faz três coisas: [autorizar], que só reserva o valor; [capturar], que cobra quando o pedido sai; e [estornar], que devolve.

**014** · 1:37 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> O cartão de crédito funciona exatamente assim.

**015** · 1:41 · **Lia** (happy, point) · Téo reage: thinking · tela: código `orders.ts`

> E o fluxo do pedido foi escrito pra qualquer pagamento, não só pro cartão.
>
> ⏸ 4s — "Leia o código"

**016** · 1:49 · **Lia** (thinking, point) · Téo reage: thinking · tela: (continua)

> Repara no cancelamento. [Antes do envio, nada foi cobrado], então não há o que devolver: a reserva expira sozinha.

**017** · 1:57 · **Téo** (happy, celebrate) · Lia reage: happy · tela: terminal

> E [o cartão confirma].

## 4 · O cartão-presente

**018** · 1:59 · **Téo** (excited, raise) · Lia reage: thinking · tela: código `gift-card.ts`

> Aí eu criei o cartão-presente. Ele herda de pagamento, como os outros.
>
> ⏸ 5s — "Leia o código"

**019** · 2:09 · **Téo** (happy, point) · Lia reage: skeptical · tela: (continua)

> Só que cartão-presente não tem reserva: o saldo já está com a loja. Então [eu debito na autorização].

**020** · 2:17 · **Lia** (skeptical) · Téo reage: happy · tela: (continua)

> E os testes dele?

**021** · 2:19 · **Téo** (excited, celebrate) · Lia reage: thinking · tela: terminal

> [Passam]. Os dois.

**022** · 2:21 · **Lia** (thinking, raise) · Téo reage: thinking, think · tela: (continua)

> Agora pensa numa cliente com cem reais no cartão-presente. Ela compra quarenta e cancela antes do envio. Quanto sobra?
>
> _voz:_ Agora pensa numa cliente com cem reais no cartão-presente. <pausa 0.2> Ela compra quarenta e cancela antes do envio. <pausa 0.3> Quanto sobra?
>
> ⏸ 4s — "Pense"

**023** · 2:34 · **Lia** (concerned, point) · Téo reage: surprised · tela: terminal

> [Sessenta]. Os quarenta reais sumiram, e o pedido nem saiu.

**024** · 2:39 · **Téo** (surprised, shrug) · Lia reage: concerned · tela: (continua)

> Mas o cancelamento está certo! Ele só devolve o que foi capturado.

**025** · 2:44 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Está certo pro contrato que ele conhece. Pra ele, autorizar não cobra nada. O seu cartão-presente cobrou.

## 5 · O culpado

**026** · 2:52 · **Téo** (happy, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Fácil: um if no cancelamento. Se for cartão-presente, devolve o saldo.

**027** · 2:58 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> Aí o cancelamento passa a conhecer cada tipo de pagamento. Chega o Pix, outro if. Chega o boleto, mais um.

**028** · 3:06 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> E todo código que recebe um pagamento vira uma lista de exceções.

**029** · 3:11 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> Esse if é um sinal tão comum que ganhou aula própria, a quinze. O culpado não é o cancelamento: é o subtipo que mudou o significado de autorizar.

## 6 · O contrato

**030** · 3:20 · **Lia** (happy, explain) · Téo reage: thinking · tela: quote

> Isso tem nome: princípio da substituição de Liskov, da Barbara Liskov, em 1987. Se um código funciona com o tipo base, tem que funcionar com qualquer subtipo, sem saber qual chegou.
>
> _voz:_ Isso tem nome: <pausa 0.2> princípio da substituição de Líscov, da Bárbara Líscov, em mil novecentos e oitenta e sete. <pausa 0.3> Se um código funciona com o tipo base, tem que funcionar com qualquer subtipo, sem saber qual chegou.

**031** · 3:34 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então herdar não garante nada?

**032** · 3:37 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> Garante que os métodos existem. [O quadrado] e [o cartão-presente] herdam tudo, e mesmo assim quebram quem usa. [Só o cartão de crédito] cumpre a promessa.

**033** · 3:47 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Então perguntar se ele "é um" é a pergunta errada?

**034** · 3:50 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> A pergunta certa é: ele se comporta como? Quem usa a base consegue usar este sem perceber a troca?

**035** · 3:58 · **Téo** (excited, raise) · Lia reage: happy · tela: código `fixed-rectangle.ts`

> E se o retângulo não tivesse setter nenhum?
>
> _voz:_ E se o retângulo não tivesse sétter nenhum?
>
> ⏸ 5s — "Leia o código"

**036** · 4:06 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> Aí o quadrado vira um subtipo perfeito. [Nada muda depois de criado], então não existe a promessa de mexer num lado só.

**037** · 4:13 · **Téo** (surprised, think) · Lia reage: happy · tela: (continua)

> A mesma classe filha é subtipo ou não, dependendo do que a mãe promete.

**038** · 4:18 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Exatamente. Liskov não é sobre a filha sozinha. É sobre o contrato que a mãe assina com quem usa.
>
> _voz:_ Exatamente. Líscov não é sobre a filha sozinha. É sobre o contrato que a mãe assina com quem usa.

**039** · 4:26 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> E se eu trocar a herança por uma interface? Aí o problema some, né?

**040** · 4:31 · **Lia** (thinking, shrug) · Téo reage: surprised · tela: (continua)

> Não some. Uma interface também promete coisas, só que sem código pra copiar. Quem implementa assina o mesmo contrato, e pode quebrar do mesmo jeito.

## 7 · A lição

**041** · 4:41 · **Lia** (thinking, explain) · Téo reage: thinking · tela: versus

> De um lado, herdar e ter os mesmos métodos, que é o que o compilador aprova. Do outro, trocar sem ninguém perceber, que é o que o cliente precisa.

**042** · 4:50 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> E o meu cartão-presente só passava no primeiro.

**043** · 4:53 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> Então, um quadrado é um retângulo? Na geometria, sempre. No código, só se cumprir o que o retângulo promete. Subtipo não é quem tem os mesmos métodos. É quem cumpre as mesmas promessas.
>
> _voz:_ Então, <pausa 0.2> um quadrado é um retângulo? <pausa 0.2> Na geometria, sempre. No código, só se cumprir o que o retângulo promete. <pausa 0.4> Subtipo não é quem tem os mesmos métodos. <pausa 0.2> É quem cumpre as mesmas promessas.

## 8 · Desafio

**044** · 5:08 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [escolhe uma classe filha] do seu projeto.

**045** · 5:12 · **Lia** (happy, explain) · tela: (continua)

> [Escreve, em uma frase, o que cada método da mãe promete]. E [procura um código] que só funciona com a mãe.

**046** · 5:19 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima, a gente escreve essas promessas de um jeito que dá pra testar: pré-condições, pós-condições e invariantes.

**047** · 5:27 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> E o Pix, com os noventa dias dele, também vai aprontar.

**048** · 5:31 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
