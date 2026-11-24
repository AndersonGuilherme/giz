# Roteiro: Aula 03 · Por que trocar o e-mail quebrou o teste do frete

> GERADO de `roteiro.ts` — edite lá e rode o build. 33 falas · 416 palavras · 19 cenas · duração 2:56 · uma cena nova a cada 9 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O alarme

**001** · 0:00 · **Téo** (surprised, raise) · Lia reage: concerned · tela: terminal

> Trocaram o provedor de e-mail... e [o teste do frete quebrou]!
>
> _voz:_ Trocaram o provedor de e-mail... <pausa 0.25> e [o teste do frete quebrou]!

**002** · 0:04 · **Lia** (skeptical) · Téo reage: confused · tela: (continua)

> O teste do frete? Ele nem manda e-mail.

**003** · 0:08 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> Pois é. Eu não mexi em nada de frete.

**004** · 0:11 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então vamos seguir a trilha. Todo erro desse tipo deixa pegadas: os imports.

## 2 · A trilha

**005** · 0:18 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `shipping-via-checkout.test.ts`

> O teste do frete [importa o checkout].
>
> ⏸ 2.5s — "Leia o código"

**006** · 0:23 · **Téo** (neutral, point) · Lia reage: thinking · tela: código `order-service.ts`

> E o checkout [importa a infra].
>
> ⏸ 2.5s — "Leia o código"

**007** · 0:28 · **Lia** (skeptical, point) · Téo reage: surprised · tela: código `infra.ts`

> E a infra [importa o provedor de e-mail].
>
> ⏸ 2.5s — "Leia o código"

**008** · 0:33 · **Téo** (surprised, point) · Lia reage: concerned · tela: código `mail-provider.ts`

> E o provedor novo [exige uma chave] assim que é carregado!
>
> ⏸ 2.5s — "Leia o código"

**009** · 0:39 · **Lia** (concerned, explain) · Téo reage: surprised · tela: graph

> Pronto: o teste do frete depende do provedor de e-mail. [Só que ninguém escreveu isso em lugar nenhum].

## 3 · A seta

**010** · 0:47 · **Lia** (happy, explain) · Téo reage: thinking · tela: cartão "Dependência é uma seta"

> Dependência é uma seta. [A aponta pra B] quando A conhece B: importa, chama ou herda.

**011** · 0:54 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> [E quando B muda, quem sofre é A].

**012** · 0:56 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> Exatamente. A mudança anda ao contrário da seta. [E B nem sabe que A existe].

## 4 · Transitiva

**013** · 1:03 · **Téo** (skeptical, raise) · Lia reage: happy · tela: Lia e Téo conversando

> Dá pra ver isso sem abrir arquivo por arquivo?

**014** · 1:06 · **Lia** (happy, point) · Téo reage: thinking · tela: terminal

> Dá. Esse script lê os imports e segue a trilha. [Três níveis] até o provedor.

**015** · 1:12 · **Téo** (surprised) · Lia reage: happy · tela: (continua)

> Então o teste depende de tudo que o checkout depende.

**016** · 1:16 · **Lia** (neutral, explain) · Téo reage: thinking · tela: (continua)

> Isso é dependência transitiva. Você não importou o provedor, mas carrega ele junto.

**017** · 1:22 · **Téo** (excited, raise) · Lia reage: happy · tela: terminal

> E o frete que a gente extraiu na aula passada?

**018** · 1:25 · **Lia** (excited, point) · Téo reage: excited · tela: (continua)

> [Um arquivo só]: a própria regra, que não importa nada. Por isso o teste dele continuou passando.

## 5 · Estável × volátil

**019** · 1:32 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> Agora, a pergunta que importa: quem muda mais? [O provedor], [a infra] e [o checkout] mudam o tempo todo. [A regra de frete], só quando muda a política da loja.

**020** · 1:43 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então a regra que quase não muda dependia de uma coisa que muda toda hora.

**021** · 1:48 · **Lia** (happy, explain) · Téo reage: thinking · tela: quote

> É esse o problema. O que muda muito pode depender do que muda pouco. O contrário espalha cada mudança pelo sistema.

**022** · 1:56 · **Téo** (skeptical, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Mas o checkout precisa mandar e-mail. Alguém tem que depender do provedor.

**023** · 2:01 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Claro. A questão é quem. Hoje é o checkout inteiro, com a regra de frete dentro. Lá na aula de inversão de dependência, a gente vira essa seta.

## 6 · A lição

**024** · 2:12 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Dependências"

> [Dependência é uma seta]: quem conhece quem.

**025** · 2:16 · **Téo** (happy, point) · tela: (continua)

> [A mudança anda contra a seta], inclusive em cadeia.

**026** · 2:19 · **Lia** (excited, point) · tela: (continua)

> E [aponte as setas para o que muda menos].

**027** · 2:22 · **Téo** (excited, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Então o ideal é não importar nada?

**028** · 2:25 · **Lia** (thinking, explain) · Téo reage: confused · tela: (continua)

> Não. Software sem dependência não faz nada. O objetivo é escolher a direção das setas, não zerar as setas.

## 7 · Desafio

**029** · 2:33 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [desenha as setas] daquele arquivo que você escolheu.

**030** · 2:37 · **Lia** (happy, explain) · tela: (continua)

> [Segue a trilha até a infra]. E [marca o que é volátil e o que é estável].

**031** · 2:42 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: abstração, interface e polimorfismo. Como trocar um if gigante por peças que se encaixam.

**032** · 2:51 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Finalmente vou poder apagar aquele switch de quarenta linhas.

**033** · 2:55 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
