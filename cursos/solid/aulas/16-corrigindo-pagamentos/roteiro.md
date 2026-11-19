# Roteiro: Aula 16 · Quatro arquivos para um pagamento novo?

> GERADO de `roteiro.ts` — edite lá e rode o build. 44 falas · 740 palavras · 20 cenas · duração 5:42 · uma cena nova a cada 17 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A conta

**001** · 0:00 · **Téo** (excited, point) · Lia reage: thinking · tela: cartão "Pedido do produto (exemplo fictício)"

> Pedido novo: [carteira digital]. [Reserva e cobra no envio], e [estorna em até cento e oitenta dias].

**002** · 0:07 · **Lia** (thinking, raise) · Téo reage: thinking, think · tela: (continua)

> No código da aula passada, quantos arquivos você teria que abrir?
>
> ⏸ 4s — "Conte"

**003** · 0:15 · **Lia** (concerned, point) · Téo reage: concerned · tela: table

> Quatro. [A classe nova], [o atendimento], com mais um instanceof, [o comprovante], com mais um case, e [um aviso novo] na base.
>
> _voz:_ Quatro. [A classe nova], [o atendimento], com mais um instance óf, [o comprovante], com mais um caso, e [um aviso novo] na base.

**004** · 0:23 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> E torcer pra ninguém esquecer nenhum.

**005** · 0:26 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Hoje a gente conserta a hierarquia de verdade. E no fim, conta de novo.

## 2 · O diagnóstico

**006** · 0:31 · **Lia** (thinking, explain) · Téo reage: thinking · tela: Lia e Téo conversando

> O problema de fundo das últimas três aulas é um só: a base prometia coisas que nem todo pagamento faz.

**007** · 0:39 · **Lia** (happy, point) · Téo reage: thinking · tela: table

> Põe numa tabela o que cada um faz de verdade. [Captura em duas etapas, só o cartão]. [Devolver o dinheiro, todos menos o cartão-presente], e o Pix com prazo.

**008** · 0:49 · **Téo** (surprised, think) · Lia reage: happy · tela: (continua)

> E a base obrigava os quatro a ter as duas coisas.

**009** · 0:52 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Aí quem não tinha, fingia: lançava erro, deixava vazio, ou escondia um prazo. Os quatro sinais da aula passada.

## 3 · Capacidades

**010** · 1:00 · **Lia** (happy, point) · Téo reage: thinking · tela: código `payment.ts`

> Então a base encolhe. [Todo pagamento tem só método e valor]. [Captura] e [estorno] viram capacidades separadas, e opcionais.
>
> ⏸ 8s — "Leia o código"

**011** · 1:18 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> O ponto de interrogação faz o trabalho do comentário!

**012** · 1:21 · **Lia** (excited, point) · Téo reage: happy · tela: (continua)

> E melhor: o que era "não chame" virou "pode não existir". E isso o compilador obriga a tratar.

**013** · 1:28 · **Lia** (thinking, point) · Téo reage: thinking · tela: (continua)

> E o prazo do Pix, que estava escondido, [entrou no contrato]: antes de estornar, pergunte se pode. Vale pra todo mundo.

**014** · 1:37 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Pera. Isso não deixa a pré-condição mais forte pra todo mundo?

**015** · 1:41 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Deixa. Por isso ficou na base, e não numa filha. Mudar o contrato é legítimo; o que quebra é mudar escondido. Agora todo cliente sabe que pode ouvir um não.

## 4 · Composição

**016** · 1:52 · **Lia** (happy, point) · Téo reage: thinking · tela: código `capabilities.ts`

> As capacidades são peças. Esse livro de estornos faz [a trava do valor] e [a conta do prazo], num lugar só.
>
> ⏸ 7s — "Leia o código"

**017** · 2:06 · **Téo** (excited, point) · Lia reage: happy · tela: código `methods.ts`

> E cada pagamento monta só as peças que tem. [O Pix passa noventa dias]. [O boleto, uma transferência agendada]. [O cartão-presente, nenhuma].
>
> ⏸ 7s — "Leia o código"

**018** · 2:23 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Sem herança. Ninguém recebe um método que não sabe cumprir, então não sobra nada pra lançar erro nem deixar vazio.

**019** · 2:31 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> E por que não uma classe mãe que estorna, e as filhas herdam dela?

**020** · 2:36 · **Lia** (thinking, shrug) · Téo reage: thinking · tela: (continua)

> Funcionaria, desde que cada filha só herde o que cumpre. Mas o prazo, a trava e o jeito de devolver variam separados. Com peças, cada pagamento combina as suas, sem uma árvore de classes pra manter.

**021** · 2:49 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E o boleto, que só agendava e não registrava nada?

**022** · 2:52 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Agora o livro registra o estorno na hora; só a transferência é que demora. A pós-condição volta a valer, e o segundo clique bate na trava.

## 5 · Quem usa

**023** · 3:01 · **Téo** (happy, point) · Lia reage: happy · tela: código `orders.ts`

> O envio: [captura, se tiver captura]. Nenhum instanceof.
>
> _voz:_ O envio: [captura, se tiver captura]. Nenhum instance óf.
>
> ⏸ 5s — "Leia o código"

**024** · 3:11 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> E lembra do cartão-presente da aula treze, que sumia com o saldo no cancelamento? Agora "reservado e não cobrado" só existe em quem tem captura. Ninguém mais confunde reserva com cobrança.

**025** · 3:24 · **Lia** (happy, point) · Téo reage: thinking · tela: código `support.ts`

> O atendimento: [sem estorno], oferece crédito na loja. [Fora do prazo], também. Nenhuma linha sabe qual pagamento chegou.
>
> ⏸ 4s — "Leia o código"

**026** · 3:37 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Mas isso ainda é um if. Não é o instanceof com outro nome?
>
> _voz:_ Mas isso ainda é um ífi. Não é o instance óf com outro nome?

**027** · 3:42 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> A diferença é a pergunta. Antes: qual classe você é? Agora: você sabe estornar? Essa pergunta está no contrato, e vale até pra pagamento que ainda nem existe.

**028** · 3:55 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> E o comprovante lê o prazo do próprio contrato. O switch pelo nome da classe sumiu.
>
> _voz:_ E o comprovante lê o prazo do próprio contrato. O suítch pelo nome da classe sumiu.

## 6 · O contrato

**029** · 4:01 · **Téo** (thinking, raise) · Lia reage: happy · tela: código `contract.test.ts`

> E o teste de contrato da aula catorze?
>
> ⏸ 4s — "Leia o código"

**030** · 4:08 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> Agora é [um por capacidade], rodando em todo pagamento que declara aquela capacidade.

**031** · 4:13 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> [Tudo verde]. Inclusive a carteira digital.

**032** · 4:17 · **Lia** (skeptical, raise) · Téo reage: thinking, think · tela: (continua)

> E se alguém declarar que estorna e deixar o método vazio de novo?
>
> ⏸ 3s — "Pense"

**033** · 4:24 · **Lia** (excited, point) · Téo reage: surprised · tela: terminal

> [O contrato pega na hora]. Pós-condição, invariante e prazo, os três vermelhos.

**034** · 4:30 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> Então o teste é a cerca. Ninguém mais entra fingindo.

## 7 · A lição

**035** · 4:34 · **Téo** (excited, point) · Lia reage: happy · tela: código `wallet.ts`

> E a carteira digital, no código novo: um arquivo. Mais uma linha no teste de contrato.
>
> ⏸ 4s — "Leia o código"

**036** · 4:45 · **Lia** (excited, point) · Téo reage: excited · tela: table

> Então, [quatro arquivos ou um]? [Um]. E em vez de torcer, [um teste que confere].

**037** · 4:51 · **Lia** (thinking, explain) · Téo reage: thinking · tela: versus

> De um lado, a base prometendo tudo, quem não cumpre fingindo, e quem usa compensando. Do outro, cada um declarando só o que cumpre.

**038** · 4:59 · **Téo** (happy, think) · Lia reage: happy · tela: (continua)

> E aí Liskov sai de graça: ninguém promete o que não entrega.
>
> _voz:_ E aí Líscov sai de graça: ninguém promete o que não entrega.

**039** · 5:04 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> Não force um subtipo a prometer o que ele não cumpre. Deixe cada um declarar só o que sabe fazer.
>
> _voz:_ Não force um subtipo a prometer o que ele não cumpre. <pausa 0.3> Deixe cada um declarar só o que sabe fazer.

## 8 · Desafio

**040** · 5:11 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [pega a hierarquia] que você caçou na aula quinze.

**041** · 5:15 · **Lia** (happy, explain) · tela: (continua)

> [Monta a tabela] do que cada filha faz de verdade. E [separa em capacidades], com um contrato por capacidade.

**042** · 5:22 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Próximo módulo"

> Repara: hoje a gente quebrou um contrato grande em capacidades pequenas. No próximo módulo, isso ganha nome: interfaces gordas, e o custo pra quem implementa. O I do SOLID.
>
> _voz:_ Repara: hoje a gente quebrou um contrato grande em capacidades pequenas. No próximo módulo, isso ganha nome: interfaces gordas, e o custo pra quem implementa. <pausa 0.2> O Í do sólid.

**043** · 5:35 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Fim do L. E os pagamentos, finalmente, cumprem o que prometem.

**044** · 5:40 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
