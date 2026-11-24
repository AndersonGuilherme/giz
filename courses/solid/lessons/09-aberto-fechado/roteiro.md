# Roteiro: Aula 09 · O que "fechado para modificação" quer dizer

> GERADO de `roteiro.ts` — edite lá e rode o build. 50 falas · 756 palavras · 20 cenas · duração 5:24 · uma cena nova a cada 16 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A pergunta

**001** · 0:00 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: quote

> Fechado para modificação. Então, depois de pronta, eu nunca mais posso editar uma classe?
>
> _voz:_ Fechado para modificação. <pausa 0.3> Então, depois de pronta, eu nunca mais posso editar uma classe?

**002** · 0:06 · **Lia** (happy, shrug) · Téo reage: surprised · tela: (continua)

> Se fosse isso, ninguém nunca mais corrigia um bug.

**003** · 0:10 · **Téo** (confused, explain) · Lia reage: happy · tela: (continua)

> Pois é. Mas é o que a frase diz, ao pé da letra.

**004** · 0:13 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> A frase é famosa, e quase todo mundo lê do jeito errado. Hoje a gente descobre o que ela pede de verdade.

## 2 · O suspeito

**005** · 0:20 · **Lia** (happy, point) · Téo reage: thinking · tela: código `price-calculator.ts`

> No fim do módulo passado, o checkout virou quatro peças. Essa é a do financeiro: a calculadora de preço.
>
> _voz:_ No fim do módulo passado, o chéquiaute virou quatro peças. <pausa 0.2> Essa é a do financeiro: a calculadora de preço.
>
> ⏸ 4s — "Leia o código"

**006** · 0:32 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> Só cuida de dinheiro. Uma responsabilidade, do jeito que a gente deixou.

**007** · 0:38 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> E as regras de desconto estão aqui: [VIP, dez por cento], [funcionário, trinta], [Black Friday, vinte pra todo mundo].

**008** · 0:45 · **Lia** (thinking, point) · Téo reage: surprised · tela: (continua)

> E uma regra escondida no Math.max: [não acumula, vale o maior].
>
> _voz:_ E uma regra escondida no máximo: [não acumula, vale o maior].

**009** · 0:50 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> E [tudo verde]. Código estável, testado, rodando em produção.

## 3 · O pedido

**010** · 0:55 · **Téo** (happy, explain) · Lia reage: thinking · tela: cartão "Pedido do marketing"

> Aí chega o marketing: quinze por cento no mês do aniversário do cliente. Sem acumular, como sempre.

**011** · 1:02 · **Téo** (excited, point) · Lia reage: skeptical · tela: código `price-calculator.v2.ts` (novidades em verde vs `price-calculator.ts`)

> Fácil. Mais um else if e pronto.
>
> _voz:_ Fácil. Mais um élse ífi e pronto.
>
> ⏸ 3s — "Leia o código"

**012** · 1:08 · **Lia** (thinking, raise) · Téo reage: confused · tela: (continua)

> Uma linha só. Será que ela funciona pra todo cliente?
>
> ⏸ 5s — "Ache o bug"

**013** · 1:18 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> [O cliente VIP] entra no primeiro if. Como o resto é else, [a linha do aniversário] nunca roda pra ele.
>
> _voz:_ [O cliente vípi] entra no primeiro ífi. Como o resto é élse, [a linha do aniversário] nunca roda pra ele.

**014** · 1:25 · **Téo** (concerned, shrug) · Lia reage: concerned · tela: terminal

> VIP fazendo aniversário: [ganhou dez em vez de quinze].

**015** · 1:29 · **Téo** (skeptical, explain) · Lia reage: thinking · tela: (continua)

> Tá, mas é só tirar o else. Erro bobo.
>
> _voz:_ Tá, mas é só tirar o élse. Erro bobo.

**016** · 1:33 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> Esse, sim. Mas repara no que aconteceu: pra adicionar uma regra nova, você editou o método de que as outras três dependem.

**017** · 1:41 · **Lia** (thinking, explain) · Téo reage: concerned · tela: (continua)

> E o próximo pedido do marketing vai abrir esse mesmo método. Cada edição arrisca uma regra que já funcionava.

**018** · 1:49 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Rigidez e fragilidade. As velhas conhecidas da aula um.

## 4 · Herança

**019** · 1:54 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `birthday-calculator.ts`

> Então eu não edito: [eu estendo]. Uma classe filha, que [chama o desconto da mãe] e compara com o aniversário.
>
> ⏸ 4s — "Leia o código"

**020** · 2:05 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> E funciona. Aliás, essa é a versão original do princípio: Bertrand Meyer, em mil novecentos e oitenta e oito, propôs estender exatamente assim, por herança.
>
> _voz:_ E funciona. <pausa 0.2> Aliás, essa é a versão original do princípio: Bertrân Máier, em mil novecentos e oitenta e oito, propôs estender exatamente assim, por herança.

**021** · 2:16 · **Téo** (excited, celebrate) · Lia reage: skeptical · tela: (continua)

> Então eu acertei?

**022** · 2:18 · **Lia** (skeptical, think) · Téo reage: thinking · tela: (continua)

> Pra um caso, sim. Agora vem o Dia das Mães. Vai ser a filha da filha?

**023** · 2:24 · **Téo** (concerned, think) · Lia reage: concerned · tela: (continua)

> E uma loja que quer Dia das Mães, mas sem aniversário, precisa de outra filha. Cada combinação vira uma classe.

**024** · 2:31 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> E alguém, em algum lugar, ainda escolhe qual dessas classes criar. A herança abriu uma porta, só que no lugar errado.

## 5 · Ponto de extensão

**025** · 2:39 · **Lia** (happy, explain) · Téo reage: thinking · tela: table

> O truque é separar o que muda do que fica. Chegou promoção nova: [somar os itens] muda? [Escolher o maior]? [Arredondar]?

**026** · 2:48 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Nada disso muda. [O que muda é a lista de promoções].

**027** · 2:53 · **Lia** (happy, point) · Téo reage: thinking · tela: código `discount-rule.ts`

> Então a lista vira uma peça que encaixa. Toda regra de desconto responde uma pergunta só: [qual a sua taxa nesse pedido].
>
> ⏸ 4s — "Leia o código"

**028** · 3:05 · **Lia** (excited, point) · Téo reage: excited · tela: código `price-calculator.open.ts`

> E a calculadora fica só com a parte estável: [pergunta pra cada regra] e [fica com a maior].
>
> ⏸ 5s — "Leia o código"

**029** · 3:17 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Ela nem sabe que existe VIP?
>
> _voz:_ Ela nem sabe que existe vípi?

**030** · 3:19 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Não sabe. E esse lugar onde uma peça nova se encaixa sem abrir o resto tem nome: ponto de extensão.

**031** · 3:27 · **Téo** (excited, point) · Lia reage: happy · tela: código `birthday.ts`

> E o aniversário vira um arquivo novo, com quatro linhas.
>
> ⏸ 4s — "Leia o código"

**032** · 3:34 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> E [o VIP aniversariante leva os quinze].
>
> _voz:_ E [o vípi aniversariante leva os quinze].

**033** · 3:37 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Repara: nenhuma linha da calculadora mudou pra isso. Esse é o fechado. Fechado pra esse tipo de mudança.

## 6 · Fechado pra quê?

**034** · 3:46 · **Téo** (skeptical, raise) · Lia reage: happy · tela: Lia e Téo conversando

> Pera aí. E se o VIP passar de dez pra doze por cento?
>
> _voz:_ Pera aí. E se o vípi passar de dez pra doze por cento?

**035** · 3:50 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Aí você edita a regra do VIP, e só ela. É uma regra mudando, não uma regra nova. Ninguém proibiu isso.
>
> _voz:_ Aí você edita a regra do vípi, e só ela. É uma regra mudando, não uma regra nova. Ninguém proibiu isso.

**036** · 3:58 · **Téo** (skeptical, think) · Lia reage: thinking · tela: (continua)

> E se a loja decidir que os descontos passam a acumular?

**037** · 4:01 · **Lia** (thinking, shrug) · Téo reage: surprised · tela: (continua)

> Aí muda justamente a parte que a gente chamou de estável, e a calculadora abre de novo. Nenhum código é fechado contra todo tipo de mudança.

**038** · 4:11 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> Você escolhe de qual mudança se proteger. Aqui foi promoção nova, porque é a que chega todo mês.

**039** · 4:17 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Então, respondendo a minha pergunta do começo: dá pra editar a classe, sim. O que não dá é editar toda vez que chega o caso de sempre.

## 7 · A lição

**040** · 4:26 · **Lia** (happy, explain) · Téo reage: thinking · tela: versus

> Fechado não é congelado. Bug se corrige, regra que muda se edita. O que fica protegido é o código estável, contra o caso novo que vive chegando.

**041** · 4:36 · **Téo** (happy, think) · Lia reage: happy · tela: (continua)

> Igual o frete da aula quatro. Lá a gente chamou de estender sem modificar.

**042** · 4:42 · **Lia** (excited, point) · Téo reage: excited · tela: quote

> É a mesma ideia, agora com nome. Aberto para o caso novo, fechado para o código que já funciona.

## 8 · Desafio

**043** · 4:48 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Resumo"

> [Separa o que muda do que fica].

**044** · 4:51 · **Téo** (happy, point) · tela: (continua)

> [O que muda entra por um ponto de extensão].

**045** · 4:53 · **Lia** (excited, point) · tela: (continua)

> [E fechado é contra uma mudança que você escolheu], não contra tudo.

**046** · 4:58 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [acha um arquivo] no seu projeto que muda sempre pelo mesmo motivo.

**047** · 5:03 · **Lia** (happy, explain) · tela: (continua)

> [Separa o que muda do que fica], e [desenha o ponto de extensão]. Só desenha, por enquanto.

**048** · 5:09 · **Téo** (thinking, raise) · Lia reage: happy · tela: cartão "Próxima aula"

> Mas e o cupom? Ele é um valor fixo, não uma porcentagem. Não cabe nessa taxa.

**049** · 5:15 · **Lia** (excited, point) · Téo reage: excited · tela: (continua)

> Boa. Na próxima aula, cupom, Dia das Mães e o contrato crescendo: promoções plugáveis de verdade.

**050** · 5:23 · **Téo** (excited, wave) · Lia reage: happy, wave · tela: Lia e Téo conversando

> Até lá!
