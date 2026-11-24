# Roteiro: Aula 14 · A linha de cinco minutos que mudou o contrato

> GERADO de `roteiro.ts` — edite lá e rode o build. 45 falas · 719 palavras · 23 cenas · duração 5:22 · uma cena nova a cada 14 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O pedido

**001** · 0:00 · **Téo** (happy, point) · Lia reage: skeptical · tela: cartão "Pedido do financeiro"

> Pedido do financeiro: [Pix só pode ser estornado em até noventa dias]. Uma linha, cinco minutos.

**002** · 0:07 · **Lia** (skeptical, think) · Téo reage: confused · tela: (continua)

> Uma linha que muda o que todo pagamento da loja promete.

**003** · 0:10 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Promete? Eu só mexi no Pix.

**004** · 0:13 · **Lia** (happy, explain) · Téo reage: thinking · tela: title

> Então vamos ver quem mais sentiu essa linha. E aprender a escrever promessas que dá pra testar.

## 2 · A tela

**005** · 0:20 · **Téo** (happy, point) · Lia reage: thinking · tela: código `pix.ts`

> Aqui. Passou de noventa dias, lança erro. Senão, estorna normal.
>
> ⏸ 4s — "Leia o código"

**006** · 0:29 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `support.ts`

> E essa é a tela do atendimento. Foi escrita pra qualquer pagamento, quando todo estorno funcionava.
>
> ⏸ 4s — "Leia o código"

**007** · 0:40 · **Lia** (thinking, raise) · Téo reage: thinking, think · tela: (continua)

> Um cliente liga cento e vinte dias depois de pagar com Pix. O que acontece nessa tela?
>
> _voz:_ Um cliente liga cento e vinte dias depois de pagar com Pix. <pausa 0.3> O que acontece nessa tela?
>
> ⏸ 4s — "Pense"

**008** · 0:50 · **Téo** (surprised, shrug) · Lia reage: concerned · tela: terminal

> [Explode]. A tela do atendimento cai com o erro do Pix.

**009** · 0:55 · **Téo** (confused, raise) · Lia reage: thinking · tela: (continua)

> Mas a regra é real. Eu devia ignorar?

**010** · 0:58 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Não. A regra é real; o problema é onde ela ficou. Escondida na subclasse, ninguém que usa a base sabe que ela existe.

## 3 · Pré-condição

**011** · 1:07 · **Lia** (happy, point) · Téo reage: thinking · tela: código `payment.ts`

> Todo método tem um contrato em três partes. A primeira é a [pré-condição]: o que precisa ser verdade pra alguém chamar.
>
> ⏸ 7s — "Leia o código"

**012** · 1:22 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Pra base, basta [estar capturado e o valor caber no que foi pago]. Nenhuma palavra sobre prazo.

**013** · 1:29 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E o Pix pediu mais: capturado, valor certo, e menos de noventa dias.

**014** · 1:34 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "O que um subtipo pode fazer"

> Primeira regra: [o subtipo pode exigir menos que a base, nunca mais]. Quem chama só conhece as exigências da base.

**015** · 1:43 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Pensa num estacionamento com uma placa: aceitamos qualquer carro. Um manobrista que só aceita carro automático está exigindo mais que a placa.

**016** · 1:52 · **Téo** (happy, shrug) · Lia reage: happy · tela: (continua)

> E eu chego de carro manual e fico na rua.

## 4 · Pós-condição

**017** · 1:55 · **Lia** (happy, point) · Téo reage: thinking · tela: código `payment.ts`

> A segunda parte é a pós-condição: o que o método garante quando termina. Aqui, o valor estornado sobe exatamente o que foi pedido.
>
> ⏸ 2s — "Leia o código"

**018** · 2:06 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `boleto.ts`

> O boleto eu fiz semana passada. O estorno dele é uma transferência, em até três dias úteis. Então [aqui só agenda].
>
> ⏸ 4s — "Leia o código"

**019** · 2:19 · **Lia** (skeptical, raise) · Téo reage: thinking, think · tela: (continua)

> E o que a tela do atendimento mostra depois desse estorno?
>
> ⏸ 3s — "Pense"

**020** · 2:26 · **Lia** (concerned, point) · Téo reage: surprised · tela: terminal

> [Zero reais]. O dinheiro vai sair, mas o pagamento não registrou nada.

**021** · 2:31 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> A base garantia o valor exato. O boleto entregou menos.

**022** · 2:36 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "O que um subtipo pode fazer"

> Segunda regra: [o subtipo pode entregar mais que a base garante, nunca menos]. O manobrista que devolve o carro lavado entrega mais. O que devolve sem a chave entrega menos.

## 5 · Invariante

**023** · 2:48 · **Téo** (concerned, raise) · Lia reage: concerned · tela: Lia e Téo conversando

> E o atendente, vendo zero reais na tela, faz o quê?

**024** · 2:51 · **Lia** (concerned, shrug) · Téo reage: surprised · tela: (continua)

> Clica de novo.

**025** · 2:53 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `payment.ts`

> Aí entra a terceira parte, a invariante: o que é verdade sempre, antes e depois de qualquer método. Nunca devolver mais do que foi pago.
>
> ⏸ 2s — "Leia o código"

**026** · 3:04 · **Lia** (concerned, explain) · Téo reage: surprised · tela: (continua)

> Quem garante isso é essa trava. Só que o boleto nunca mexe no valor estornado, então a trava nunca dispara. Dois cliques: cento e sessenta reais agendados de um pagamento de oitenta.

**027** · 3:17 · **Téo** (surprised, think) · Lia reage: thinking · tela: (continua)

> A pós-condição fraca derrubou a invariante junto.

**028** · 3:20 · **Lia** (thinking, explain) · Téo reage: thinking · tela: cartão "O que um subtipo pode fazer"

> É comum. A trava confiava na pós-condição. Daí a terceira regra: [o que a base mantém sempre verdadeiro, o subtipo também mantém].

## 6 · Teste de contrato

**029** · 3:30 · **Téo** (thinking, raise) · Lia reage: happy · tela: (continua)

> Tá. E como eu pego isso antes do atendimento?

**030** · 3:34 · **Lia** (happy, point) · Téo reage: thinking · tela: código `contract.ts`

> Escrevendo o contrato uma vez só, como teste, e rodando em todo subtipo.
>
> ⏸ 7s — "Leia o código"

**031** · 3:46 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> [Uma pré], [uma pós], [uma invariante]. Cada promessa da base vira um teste que qualquer filha tem que passar.

**032** · 3:53 · **Téo** (excited, point) · Lia reage: thinking · tela: terminal

> Roda nos três. [O cartão passa]. [O Pix e o boleto, não].

**033** · 3:58 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> E cada falha aponta a parte exata do contrato: o Pix na pré, o boleto na pós e na invariante. Sem cliente ligar.

**034** · 4:06 · **Téo** (happy, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Fácil: no teste do Pix, eu tiro o caso dos cento e vinte dias.

**035** · 4:10 · **Lia** (concerned, explain) · Téo reage: thinking · tela: versus

> Aí tudo passa e o atendimento continua caindo. O teste só vale se for o mesmo pra todo mundo. Se o prazo é real, ele entra no contrato da base, onde todo cliente enxerga.

**036** · 4:22 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E como a base fala de prazo sem virar uma lista de exceções?

**037** · 4:26 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Isso é a aula dezesseis. Antes, na quinze, a gente aprende a farejar esse problema no código.

## 7 · A lição

**038** · 4:32 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Resumo"

> [Pré-condição]: não pode ficar mais forte. [Pós-condição]: não pode ficar mais fraca.

**039** · 4:40 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> [Invariante]: continua valendo. E [o teste de contrato] é o mesmo pra todo subtipo.

**040** · 4:46 · **Lia** (excited, explain) · Téo reage: happy · tela: quote

> Então a linha de cinco minutos não era sobre o Pix. Ela mudou o que todo pagamento prometia ao atendimento, sem avisar ninguém. Um subtipo pode exigir menos e entregar mais. Nunca o contrário.
>
> _voz:_ Então a linha de cinco minutos não era sobre o Pix. <pausa 0.2> Ela mudou o que todo pagamento prometia ao atendimento, sem avisar ninguém. <pausa 0.4> Um subtipo pode exigir menos e entregar mais. <pausa 0.2> Nunca o contrário.

## 8 · Desafio

**041** · 5:00 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [escolhe uma classe base] do seu projeto.

**042** · 5:04 · **Lia** (happy, explain) · tela: (continua)

> [Escreve a pré, a pós e a invariante] de um método. E [vira isso em teste], rodando em todas as filhas.

**043** · 5:11 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima: os sinais de que uma hierarquia já está quebrando, e que dá pra achar com uma busca no código.

**044** · 5:18 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Eu já sinto cheiro de if por tipo.

**045** · 5:20 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
