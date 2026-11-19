# Roteiro: Aula 07 · Refatorar na sexta à tarde?

> GERADO de `roteiro.ts` — edite lá e rode o build. 50 falas · 723 palavras · 22 cenas · duração 5:33 · uma cena nova a cada 15 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A decisão

**001** · 0:00 · **Téo** (excited, raise) · Lia reage: skeptical · tela: cartão "Sexta, 16h: cortar o checkout em 4 classes"

> Sexta, quatro da tarde. Quero cortar o checkout nas quatro classes da aula passada. [Em produção]. [Com a Black Friday chegando].
>
> _voz:_ Sexta, quatro da tarde. Quero cortar o chéquiaute nas quatro classes da aula passada. [Em produção]. <pausa 0.2> [Com a bléqui fráidei chegando].

**002** · 0:09 · **Lia** (skeptical, think) · Téo reage: confused · tela: (continua)

> Depende de uma coisa só. Se você quebrar alguma coisa, como vai saber?

**003** · 0:14 · **Téo** (confused, shrug) · Lia reage: concerned · tela: (continua)

> Hum... o cliente reclama?

**004** · 0:17 · **Lia** (happy, explain) · Téo reage: happy · tela: title

> Então hoje a gente faz esse corte de verdade. Num sistema em produção, sem que nenhum cliente perceba.

## 2 · A rede

**005** · 0:24 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "Refatorar é…"

> Primeiro, a palavra. Refatorar é [mudar a estrutura] [sem mudar o comportamento]. Se o comportamento mudou, não foi refatoração.

**006** · 0:33 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> E como eu provo que nada mudou?

**007** · 0:35 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Armando uma rede antes de pular: testes de caracterização. Eles anotam o que o código faz hoje. Não o que deveria fazer: o que ele faz.

**008** · 0:46 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Mesmo se hoje ele fizer alguma coisa errada?

**009** · 0:49 · **Lia** (skeptical, explain) · Téo reage: surprised · tela: (continua)

> Mesmo assim. Corrigir bug é outro passo, separado. Misturando os dois, você perde a conta do que mudou de propósito.

**010** · 0:57 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `characterization.ts`

> São quatro testes, um pra cada coisa que o checkout entrega: [o preço], [a Black Friday], [a gravação] e [o e-mail].
>
> _voz:_ São quatro testes, um pra cada coisa que o chéquiaute entrega: [o preço], [a bléqui fráidei], [a gravação] e [o e-mail].
>
> ⏸ 7s — "Leia o código"

**011** · 1:12 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> E todos [entram pela porta da frente]: só chamam o checkout. Não sabem nada do que tem lá dentro.
>
> _voz:_ E todos [entram pela porta da frente]: só chamam o chéquiaute. Não sabem nada do que tem lá dentro.

**012** · 1:19 · **Lia** (excited, explain) · Téo reage: surprised · tela: (continua)

> Por isso eles sobrevivem à refatoração. Teste que conhece as entranhas quebra a cada passo, e aí ninguém confia mais nele.

## 3 · O espaço

**013** · 1:27 · **Téo** (confused, point) · Lia reage: thinking · tela: terminal

> O do e-mail eu escrevi de cabeça, primeiro só com o começo do texto. [E ele falhou].

**014** · 1:33 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> As duas linhas parecem iguais. Consegue ver a diferença?
>
> ⏸ 4s — "Ache a diferença"

**015** · 1:42 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> [É o espaço depois do R$]. A formatação de moeda usa um espaço inseparável, que é outro caractere.
>
> _voz:_ [É o espaço depois do símbolo do real]. A formatação de moeda usa um espaço inseparável, que é outro caractere.

**016** · 1:49 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> O código estava certo. Errado estava o meu palpite!

**017** · 1:53 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Essa é a regra da caracterização: você não escreve o que acha. Roda, copia a saída real e trava no teste.

**018** · 2:01 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Não seria mais rápido reescrever do zero, já separado?

**019** · 2:05 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Parece. Mas a reescrita joga fora os detalhes que ninguém lembra, como esse espaço. O sistema antigo é a melhor especificação que você tem.

**020** · 2:15 · **Lia** (neutral, point) · Téo reage: happy · tela: código `characterization.ts`

> Então o teste final guarda o texto exato, com o caractere certo, e um comentário pra quem vier depois.
>
> ⏸ 3s — "Leia o código"

**021** · 2:24 · **Téo** (happy, point) · Lia reage: happy · tela: terminal

> Passo zero: [quatro verdes], sem mexer em nenhuma linha do checkout. A rede está armada.
>
> _voz:_ Passo zero: [quatro verdes], sem mexer em nenhuma linha do chéquiaute. A rede está armada.

## 4 · Passo 1

**022** · 2:31 · **Téo** (happy, explain) · Lia reage: thinking · tela: terminal

> Passo um: só o preço. Tirei a soma e o desconto pro PriceCalculator, rodei os testes e... [um vermelho].
>
> _voz:_ Passo um: só o preço. Tirei a soma e o desconto pro práici calculêitor, rodei os testes e... <pausa 0.3> [um vermelho].

**023** · 2:39 · **Lia** (concerned, point) · Téo reage: concerned · tela: (continua)

> Duzentos e dez reais cheios, sem os vinte por cento. Cadê a Black Friday?
>
> _voz:_ Duzentos e dez reais cheios, sem os vinte por cento. Cadê a bléqui fráidei?

**024** · 2:45 · **Téo** (concerned, point) · Lia reage: thinking · tela: código `price-calculator.wrong.ts`

> [O método novo não recebe a data]. A linha da Black Friday não compilava sem ela... e eu apaguei.
>
> _voz:_ [O método novo não recebe a data]. A linha da bléqui fráidei não compilava sem ela... <pausa 0.2> e eu apaguei.
>
> ⏸ 4s — "Leia o código"

**025** · 2:56 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Acoplamento escondido, lembra da aula dois? O desconto depende da data. Mover as linhas deixou isso à mostra.

**026** · 3:05 · **Lia** (happy, point) · Téo reage: happy · tela: código `price-calculator.ts` (novidades em verde vs `price-calculator.wrong.ts`)

> O conserto: [a data entra no contrato], e a linha volta, igualzinha.
>
> ⏸ 3s — "Leia o código"

**027** · 3:13 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> [Quatro verdes]. O erro apareceu cinco minutos depois de nascer, e não na Black Friday, com cliente reclamando.
>
> _voz:_ [Quatro verdes]. O erro apareceu cinco minutos depois de nascer, e não na bléqui fráidei, com cliente reclamando.

**028** · 3:20 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> É o valor do passo pequeno: quando quebra, você sabe exatamente qual mudança foi. Mudou uma coisa só.

## 5 · Passos 2 e 3

**029** · 3:27 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `order-service.step2.ts` (novidades em verde vs `order-service.step1.ts`)

> Passo dois: a gravação vai pro repositório de pedidos. Uma classe, uma rodada de testes.
>
> ⏸ 6s — "Leia o código"

**030** · 3:40 · **Téo** (happy, point) · Lia reage: happy · tela: terminal

> [Verde de novo]. Nem deu tempo de ficar nervoso.

**031** · 3:45 · **Lia** (happy, point) · Téo reage: thinking · tela: código `order-service.step3.ts` (novidades em verde vs `order-service.step2.ts`)

> Passo três: o e-mail vai pro notificador. E olha o que sobrou no checkout.
>
> _voz:_ Passo três: o e-mail vai pro notificador. E olha o que sobrou no chéquiaute.
>
> ⏸ 6s — "Leia o código"

**032** · 3:57 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> Sobrou só o roteiro: [preço], [frete], [grava], [avisa].

**033** · 4:01 · **Lia** (excited, point) · Téo reage: excited · tela: terminal

> E a rede segurou até o fim: [quatro verdes] no último passo.

**034** · 4:06 · **Téo** (thinking, raise) · Lia reage: happy · tela: (continua)

> E agora que as classes existem, cada uma pode ganhar teste próprio?

**035** · 4:10 · **Lia** (happy, point) · Téo reage: happy · tela: terminal

> Pode e deve. [A regra do maior desconto], testada sozinha, sem banco e sem e-mail.

## 6 · O pedido

**036** · 4:16 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> E o pedido da comunicação, a economia em reais redondos? Ficou esperando a tarde inteira.

**037** · 4:22 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> De propósito. Agora ele vira um passo separado: mexe só no notificador, e só o teste do e-mail muda.

**038** · 4:29 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então, nesse passo, o vermelho do e-mail é esperado. E se outro teste ficar vermelho...

**039** · 4:35 · **Lia** (skeptical, point) · Téo reage: surprised · tela: (continua)

> ... a mudança vazou pra onde não devia. A mesma rede, agora apontando vazamento.

**040** · 4:41 · **Téo** (happy, raise) · Lia reage: happy · tela: (continua)

> Voltando à pergunta do começo: refatorar sexta à tarde pode, então?

**041** · 4:46 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Com a rede armada e passos pequenos, pode. Sem rede, nem na segunda de manhã.

## 7 · A lição

**042** · 4:52 · **Lia** (happy, explain) · Téo reage: happy · tela: cartão "Refatorar sem quebrar"

> [Caracterize antes]: trave o que o código faz, copiando a saída real.

**043** · 4:57 · **Téo** (happy, point) · tela: (continua)

> [Uma extração por vez], com os testes rodando a cada passo.

**044** · 5:01 · **Lia** (skeptical, point) · tela: (continua)

> E [nunca misture] refatorar com mudar comportamento. Cada um no seu passo.

**045** · 5:06 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> Primeiro a rede. Depois, um passo de cada vez.

## 8 · Desafio

**046** · 5:10 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [escolhe um método grande] do seu projeto.

**047** · 5:14 · **Lia** (happy, explain) · tela: (continua)

> [Escreve três testes de caracterização], copiando a saída real. Depois [extrai uma classe só] e roda os testes.

**048** · 5:22 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula, o outro lado: quando separar demais vira problema.

**049** · 5:27 · **Téo** (surprised, shrug) · Lia reage: skeptical · tela: Lia e Téo conversando

> Separar demais? Eu achava que quanto mais, melhor.

**050** · 5:31 · **Lia** (excited, wave) · Téo reage: surprised, wave · tela: (continua)

> Pois é. Até lá!
