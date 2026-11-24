# Roteiro: Aula 11 · Aberto/fechado sem uma classe sequer

> GERADO de `roteiro.ts` — edite lá e rode o build. 47 falas · 720 palavras · 19 cenas · duração 5:27 · uma cena nova a cada 17 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A provocação

**001** · 0:00 · **Téo** (skeptical, raise) · Lia reage: happy · tela: código `store.ts`

> Sem classe, sem interface, sem herança. Isso ainda é aberto/fechado?
>
> _voz:_ Sem classe, sem interface, sem herança. <pausa 0.2> Isso ainda é aberto e fechado?
>
> ⏸ 4s — "Leia o código"

**002** · 0:09 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> É. E, dependendo do que mudar, é até mais aberto que a versão da aula passada.

**003** · 0:15 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> Mais aberto, sem nenhuma interface? Essa eu quero ver.

**004** · 0:19 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então vamos montar essa loja do zero, peça por peça. Só com funções.

## 2 · Regra é função

**005** · 0:24 · **Lia** (happy, point) · Téo reage: thinking · tela: código `rules-fn.ts`

> Começa pelo contrato. Na aula passada, a regra era um objeto com nome e método. [Aqui é só uma função]: recebe o contexto, devolve centavos.
>
> ⏸ 5s — "Leia o código"

**006** · 0:40 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> O contrato continua lá. Só que agora cabe em uma linha.

**007** · 0:44 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Em TypeScript, o tipo de uma função já é um contrato. Quem tem esse formato, encaixa.
>
> _voz:_ Em táip script, o tipo de uma função já é um contrato. Quem tem esse formato, encaixa.

## 3 · Fábricas

**008** · 0:51 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> E aqui está o pulo do gato: [uma função que recebe a configuração e devolve uma regra]. Entra taxa e condição, sai regra pronta.

**009** · 1:00 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Função que devolve função. É a tal função de ordem superior?

**010** · 1:04 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> Ela mesma. [Desconto fixo] segue a mesma ideia. E as condições também são funções pequenas: [é VIP], [usou o cupom], [está entre duas datas].
>
> _voz:_ Ela mesma. [Desconto fixo] segue a mesma ideia. E as condições também são funções pequenas: [é vípi], [usou o cupom], [está entre duas datas].

**011** · 1:15 · **Téo** (excited, point) · Lia reage: happy · tela: código `store.ts`

> Agora eu leio a loja: [VIP é dez por cento, quando é VIP]. [O Dia das Mães, quinze, entre quatro e dez de maio].
>
> _voz:_ Agora eu leio a loja: [vípi é dez por cento, quando é vípi]. [O Dia das Mães, quinze, entre quatro e dez de maio].
>
> ⏸ 3s — "Leia o código"

## 4 · Compor

**012** · 1:26 · **Lia** (happy, point) · Téo reage: thinking · tela: código `combinators.ts`

> E a política da aula passada? Também virou função. [Melhor de] fica com o maior; [com teto] limita ao subtotal.
>
> ⏸ 4s — "Leia o código"

**013** · 1:38 · **Téo** (confused, think) · Lia reage: happy · tela: (continua)

> Pera. Melhor de recebe regras e devolve... uma regra?

**014** · 1:43 · **Lia** (excited, explain) · Téo reage: surprised · tela: (continua)

> Devolve. Então dá pra encaixar uma dentro da outra, quantas vezes quiser. Isso é composição.

**015** · 1:50 · **Lia** (thinking, raise) · Téo reage: thinking · tela: cartão "Pedido do financeiro"

> Agora o pedido que derrubaria a aula passada: na Black Friday, o cupom passa a acumular. Na versão com classes, onde você mexeria?
>
> ⏸ 3s — "Pense"

**016** · 2:02 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Na calculadora. O vale o maior tava lá dentro, fixo no laço.

**017** · 2:06 · **Lia** (excited, point) · Téo reage: excited · tela: código `store.combo.ts` (novidades em verde vs `store.ts`)

> Aqui, [somar é só mais uma peça]. Black Friday e cupom somam, e o resultado disputa com o resto.
>
> ⏸ 3s — "Leia o código"

**018** · 2:16 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> [Vinte de Black Friday mais vinte e cinco de cupom]. E nenhuma regra foi editada.

**019** · 2:22 · **Lia** (thinking, explain) · Téo reage: thinking · tela: Lia e Téo conversando

> Pra ser justa com as classes: dava pra fazer uma regra que soma outras duas. Composição não é exclusividade de função.

**020** · 2:31 · **Téo** (happy, think) · Lia reage: happy · tela: (continua)

> Mas com função custa uma linha, não um arquivo.

## 5 · Tabela

**021** · 2:34 · **Téo** (excited, raise) · Lia reage: skeptical · tela: (continua)

> E se eu tirar até o código? O marketing cadastra a promoção sozinho.

**022** · 2:39 · **Lia** (happy, point) · Téo reage: thinking · tela: código `promotions.json`

> Dá. Cada linha é uma promoção: [quanto desconta] e [quando vale].
>
> ⏸ 4s — "Leia o código"

**023** · 2:48 · **Lia** (happy, point) · Téo reage: surprised · tela: código `from-config.ts`

> E um intérprete transforma cada linha em regra, [usando as mesmas fábricas].
>
> ⏸ 7s — "Leia o código"

**024** · 3:00 · **Téo** (excited, celebrate) · Lia reage: skeptical · tela: (continua)

> O Dia das Mães virou uma linha de JSON. Nem passa por revisão de código!
>
> _voz:_ O Dia das Mães virou uma linha de jêison. Nem passa por revisão de código!

**025** · 3:06 · **Lia** (skeptical, raise) · Téo reage: concerned · tela: (continua)

> Esse é justamente o risco. E se alguém digitar cento e cinquenta por cento?

**026** · 3:11 · **Téo** (happy, point) · Lia reage: happy · tela: terminal

> O intérprete valida cada linha. [Barrado na entrada].

**027** · 3:15 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Dado vira comportamento sem passar pelo compilador. Então validação é obrigatória, com teste próprio.

## 6 · O limite

**028** · 3:23 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> E o leve três, pague dois, do desafio passado? Cabe numa linha da tabela?

**029** · 3:28 · **Lia** (thinking, shrug) · Téo reage: surprised · tela: (continua)

> Não cabe. A tabela só conhece porcentagem e valor fixo. Um tipo novo de promoção precisa de código no intérprete.

**030** · 3:37 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Então o ponto de extensão não sumiu. Só mudou de lugar.

**031** · 3:41 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> Exato. A tabela fica aberta pra promoção de um tipo que ela já conhece. Pra um tipo novo, quem abre é o intérprete.

**032** · 3:49 · **Téo** (thinking, raise) · Lia reage: surprised · tela: (continua)

> E reparou que uma coisa sumiu? O nome da promoção, que ia pro e-mail.

**033** · 3:54 · **Lia** (surprised, point) · Téo reage: thinking · tela: (continua)

> Bem lembrado. Essa função devolve só um número. Se o nome importa, ela passa a devolver nome e valor, e o contrato cresce de novo.

**034** · 4:03 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Função não é mágica. Ela é mais simples porque carrega menos coisa.

## 7 · A lição

**035** · 4:08 · **Lia** (happy, explain) · Téo reage: thinking · tela: table

> Juntando as três versões. [Promoção nova]: todas aguentam bem. [Mudar a política]: a função troca uma peça.

**036** · 4:17 · **Téo** (thinking, point) · Lia reage: happy · tela: (continua)

> [Tipo novo]: a tabela precisa de código. [E quem adiciona]: só na tabela o marketing faz sozinho.

**037** · 4:25 · **Téo** (skeptical, shrug) · Lia reage: happy · tela: (continua)

> Tá, mas qual é a melhor?

**038** · 4:27 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Depende de quem muda e do quê. Classe ajuda quando a regra guarda estado ou precisa de banco. Função, quando é cálculo puro. Tabela, quando quem muda não programa.

**039** · 4:39 · **Lia** (excited, point) · Téo reage: excited · tela: quote

> O princípio nunca foi sobre herança. Aberto e fechado é sobre onde a mudança entra.

**040** · 4:44 · **Téo** (happy, raise) · Lia reage: happy · tela: (continua)

> Então, respondendo a minha provocação: nenhuma classe, e era aberto e fechado o tempo todo.

## 8 · Desafio

**041** · 4:50 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Resumo"

> [Regra é função]: o formato já é o contrato. [Fábricas e combinadores]: até a política vira peça.

**042** · 4:59 · **Téo** (happy, point) · tela: (continua)

> [E a tabela] abre pra quem não programa, desde que tenha validação.

**043** · 5:03 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [reescreve uma regra do seu projeto como função], e [monta a política] com melhor de e soma de.

**044** · 5:09 · **Lia** (thinking, explain) · tela: (continua)

> E o mais importante: [acha uma mudança que a sua tabela não aceita].

**045** · 5:14 · **Téo** (excited, celebrate) · Lia reage: skeptical · tela: cartão "Próxima aula"

> Agora eu quero abrir tudo. Imposto, frete, e-mail, tudo plugável!

**046** · 5:19 · **Lia** (skeptical, raise) · Téo reage: surprised · tela: (continua)

> Calma. Na próxima aula, a gente vê quanto custa um ponto de extensão que ninguém usou.

**047** · 5:26 · **Téo** (happy, wave) · Lia reage: happy, wave · tela: Lia e Téo conversando

> Até lá!
