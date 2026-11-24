# Roteiro: Aula 02 · Por que mover 3 linhas levou 2 dias

> GERADO de `roteiro.ts` — edite lá e rode o build. 38 falas · 498 palavras · 17 cenas · duração 3:50 · uma cena nova a cada 14 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O mistério

**001** · 0:00 · **Téo** (concerned, explain) · Lia reage: thinking · tela: cartão "Reusar a regra de frete no carrinho"

> Lembra do carrinho que criava pedidos? Tirar o frete de dentro do checkout ia levar cinco minutos. Levou [dois dias].

**002** · 0:08 · **Lia** (surprised) · Téo reage: concerned · tela: (continua)

> Dois dias pra mover três linhas?

**003** · 0:11 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> Toda vez que eu puxava o frete, vinha outra coisa grudada junto.

**004** · 0:15 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então hoje a gente vai medir isso. Com duas réguas que todo desenvolvedor devia carregar no bolso.

## 2 · A régua

**005** · 0:22 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "As duas réguas"

> [Coesão] pergunta: o que está junto deveria estar junto? [Acoplamento] pergunta: quanto uma parte precisa saber da outra pra funcionar?

**006** · 0:32 · **Téo** (skeptical) · Lia reage: happy · tela: (continua)

> Bonito na teoria. Mas como eu meço isso num código de verdade?

**007** · 0:37 · **Lia** (excited, explain) · Téo reage: confused · tela: (continua)

> Com uma tabela. Pra cada pedaço do checkout, anota quais dados ele usa.

## 3 · Coesão

**008** · 0:42 · **Lia** (neutral, point) · Téo reage: thinking · tela: table

> Nas linhas, os pedaços do método: [soma dos itens], [desconto], [frete], [gravação] e [e-mail].

**009** · 0:49 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Antes da Lia falar: tem uma coluna que aparece em todas as linhas. Qual é?
>
> _voz:_ Antes da Lia falar: <pausa 0.2> tem uma coluna que aparece em todas as linhas. Qual é?
>
> ⏸ 3s — "Ache a coluna"

**010** · 0:58 · **Lia** (happy, point) · Téo reage: excited · tela: (continua)

> É [o total]. É a única coisa que une esses cinco pedaços.

**011** · 1:02 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> Quando as partes de uma classe quase não dividem dados, a coesão é baixa. Na prática, são várias classes morando no mesmo endereço.

**012** · 1:10 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> Cinco assuntos num método só, presos por uma variável.

## 4 · Acoplamento

**013** · 1:14 · **Lia** (skeptical, point) · Téo reage: thinking · tela: código `order-service.before.ts`

> Agora a segunda régua. Olha a linha do frete. O que ela precisa saber pra funcionar?
>
> ⏸ 7s — "Leia o código"

**014** · 1:28 · **Téo** (neutral, point) · Lia reage: happy · tela: (continua)

> [O método de entrega]... [e o total].
>
> _voz:_ [O método de entrega]... <pausa 0.2> [e o total].

**015** · 1:31 · **Lia** (skeptical) · Téo reage: confused · tela: (continua)

> Só isso? E se eu quiser rodar essa linha fora do checkout?

**016** · 1:36 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Aí eu preciso de um pedido, um cliente, uma data... e o checkout ainda grava e manda e-mail.

**017** · 1:42 · **Lia** (happy, explain) · Téo reage: thinking · tela: table

> Cada item dessa lista é [acoplamento]. São seis coisas. Quanto maior a lista, mais caro mudar ou reaproveitar.

## 5 · O fio invisível

**018** · 1:50 · **Lia** (thinking, point) · Téo reage: confused · tela: código `order-service.before.ts`

> E tem um acoplamento que não aparece em import nenhum: [a ordem das linhas].
>
> ⏸ 3s — "Leia o código"

**019** · 1:59 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Porque o total muda de significado dependendo de onde você está no método?

**020** · 2:04 · **Lia** (excited, explain) · Téo reage: surprised · tela: (continua)

> Isso. Antes do desconto, ele é o subtotal. Depois, é o valor com desconto. Mover uma linha muda o resultado.

**021** · 2:12 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Foi isso que quebrou o frete grátis na Black Friday!

**022** · 2:16 · **Lia** (concerned, explain) · Téo reage: thinking · tela: quote

> O nome disso é acoplamento temporal. É o mais traiçoeiro, porque o compilador não avisa.

## 6 · A extração

**023** · 2:22 · **Téo** (excited, raise) · Lia reage: happy · tela: código `shipping.ts`

> Então a extração certa é uma função que recebe [só o que precisa]: o método e o subtotal.
>
> ⏸ 4s — "Leia o código"

**024** · 2:32 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> E o nome já conta a regra: [subtotal]. Ninguém mais confunde com o valor com desconto.

**025** · 2:39 · **Téo** (happy, point) · Lia reage: happy · tela: código `cart-preview.ts`

> E o carrinho fica assim: uma linha. Sem pedido, sem e-mail.
>
> ⏸ 4s — "Leia o código"

**026** · 2:48 · **Lia** (excited, point) · Téo reage: excited · tela: terminal

> E olha o bônus: [com o frete separado, o bug da Black Friday sumiu].

**027** · 2:53 · **Téo** (excited, celebrate) · Lia reage: happy · tela: (continua)

> Duas aulas, um bug a menos!

**028** · 2:56 · **Lia** (happy, explain) · Téo reage: happy · tela: table

> Mesma regra. Antes, o frete precisava saber seis coisas. Agora, duas.

## 7 · A lição

**029** · 3:02 · **Lia** (happy, explain) · Téo reage: happy · tela: cartão "A régua"

> [Coesão alta]: o que muda junto, fica junto.

**030** · 3:06 · **Téo** (happy, point) · tela: (continua)

> [Acoplamento baixo]: cada parte sabe só o que precisa.

**031** · 3:10 · **Lia** (skeptical, point) · tela: (continua)

> E desconfie de [variável que muda de significado] no meio do caminho.

**032** · 3:15 · **Téo** (excited, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Então é só quebrar tudo em funçõezinhas?

**033** · 3:18 · **Lia** (thinking, explain) · Téo reage: confused · tela: (continua)

> Não. Separar demais também derruba a coesão: a regra fica espalhada em dez arquivos. A régua serve pros dois lados.

## 8 · Desafio

**034** · 3:27 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [monta a tabela] daquele arquivo que você escolheu na aula passada.

**035** · 3:33 · **Lia** (happy, explain) · tela: (continua)

> [Procura a coluna que gruda tudo]. E [lista o que uma função dele precisa saber] pra rodar sozinha.

**036** · 3:39 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: dependências. Quem conhece quem, e por que a direção da seta importa.

**037** · 3:46 · **Téo** (skeptical, explain) · Lia reage: happy · tela: Lia e Téo conversando

> Spoiler: importa muito.

**038** · 3:49 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
