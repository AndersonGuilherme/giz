# Roteiro: Aula 23 · Cinco refatorações, nenhum teste vermelho

> GERADO de `roteiro.ts` — edite lá e rode o build. 59 falas · 927 palavras · 32 cenas · duração 7:07 · uma cena nova a cada 13 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A aposta

**001** · 0:00 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `order-service.v4.ts`

> Aposto um café que esse checkout não sobrevive a cinco refatorações seguidas sem quebrar.
>
> _voz:_ Aposto um café que esse checkout não sobrevive a cinco refatorações seguidas... <pausa 0.2> sem quebrar.

**002** · 0:06 · **Lia** (happy, point) · Téo reage: excited · tela: (continua)

> Aposta aceita. Um passo por princípio, e os testes não podem ficar vermelhos nem uma vez.

**003** · 0:13 · **Téo** (skeptical, explain) · Lia reage: happy · tela: (continua)

> E no fim a gente mede. Dependências, linhas, tempo de teste. Número de verdade.

**004** · 0:19 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> E de quebra, a gente encerra de vez o caso dos três mil e-mails.

## 2 · A rede

**005** · 0:23 · **Lia** (thinking, explain) · Téo reage: thinking · tela: cartão "A rede de proteção"

> Antes de mexer, a rede de proteção. [As regras da loja viram testes]: frete grátis, descontos, e-mail. [E os mesmos sete testes rodam contra cada versão].

**006** · 0:35 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> [Se um passo mudar qualquer resultado], ele volta.

**007** · 0:38 · **Téo** (surprised, raise) · Lia reage: concerned · tela: terminal

> Rodando contra o código original da aula um... [dois vermelhos]!
>
> _voz:_ Rodando contra o código original da aula um... <pausa 0.3> [dois vermelhos]!

**008** · 0:43 · **Lia** (concerned, point) · Téo reage: surprised · tela: (continua)

> O bug da aula um continua lá. Com desconto, o subtotal de duzentos e dez perde o frete grátis. O teste lembra da regra que o código esqueceu.

**009** · 0:53 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> Então a gente aproveita e conserta durante a refatoração?

**010** · 0:57 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Num passo separado. Refatorar muda a estrutura; consertar muda o comportamento. Misturando os dois, quando algo quebra, ninguém sabe qual foi.

**011** · 1:06 · **Téo** (happy, point) · Lia reage: happy · tela: código `order-service.v5.ts` (novidades em verde vs `order-service.v4.ts`)

> O conserto é [uma palavra]: total virou subtotal. Verde.
>
> ⏸ 9s — "Leia o código"

**012** · 1:21 · **Lia** (skeptical, point) · Téo reage: thinking · tela: (continua)

> Uma palavra conserta o sintoma. Mas o desenho que deixou esse bug nascer continua igualzinho. É ele que a gente vai mudar.

## 3 · SRP

**013** · 1:29 · **Lia** (happy, point) · Téo reage: thinking, think · tela: (continua)

> Passo um, responsabilidade única. Quantos atores pedem mudança nesse método?
>
> ⏸ 3s — "Quantos atores?"

**014** · 1:38 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [O financeiro], [a logística], [quem cuida do banco]... [e a comunicação]. Quatro.

**015** · 1:44 · **Lia** (happy, explain) · Téo reage: thinking · tela: código `passo1/order-service.ts`

> Então são quatro módulos, cada um com um dono. E o checkout só orquestra.
>
> ⏸ 4s — "Leia o código"

**016** · 1:53 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> Olha o frete: [ele recebe o subtotal] direto do cálculo de preço.

**017** · 1:58 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Por construção. Não existe mais uma variável total que muda de significado no meio do caminho.

**018** · 2:04 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E o dryRun, cadê?
>
> _voz:_ E o drai ran, cadê?

**019** · 2:06 · **Lia** (excited, point) · Téo reage: excited · tela: terminal

> Sumiu. O carrinho chama a regra de frete direto, ninguém precisa de atalho. [E o passo um passou].

## 4 · OCP e LSP

**020** · 2:13 · **Téo** (neutral, explain) · Lia reage: thinking · tela: cartão "O que sempre travava"

> Passo dois, aberto e fechado. O que sempre travava esse checkout: [promoção nova] e [frete novo].

**021** · 2:21 · **Lia** (happy, point) · Téo reage: thinking · tela: código `passo2/pricing.ts` (novidades em verde vs `passo1/pricing.ts`)

> Cada desconto virou uma regra numa lista. [Vale o maior], como manda a loja.
>
> ⏸ 5s — "Leia o código"

**022** · 2:31 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Então promoção nova é [uma linha a mais na lista], e a função de preço nem fica sabendo.

**023** · 2:37 · **Lia** (neutral, explain) · Téo reage: happy · tela: terminal

> E o frete foi pelo mesmo caminho: cada método virou um objeto, como na aula quatro. [Passo dois, verde].

**024** · 2:44 · **Lia** (skeptical, point) · Téo reage: concerned · tela: terminal

> Só que aí o carrinho passou a listar todos os fretes. E o contrato do frete [pegou um impostor].

**025** · 2:50 · **Téo** (surprised, raise) · Lia reage: thinking · tela: (continua)

> O mesmo dia! Longe da loja, em vez de dar um preço, ele explode.

**026** · 2:55 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> E pra quem chama, todo método de entrega tem que valer o mesmo. Um que explode quebra a substituição. Passo três, Liskov.

**027** · 3:04 · **Lia** (happy, point) · Téo reage: happy · tela: código `passo3/shipping.ts` (novidades em verde vs `passo2/shipping.ts`)

> O contrato agora pergunta [se o método está disponível]. Regra da loja: o mesmo dia atende até quinze quilômetros. Quem não atende avisa, em vez de explodir.
>
> ⏸ 7s — "Leia o código"

**028** · 3:22 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> E o checkout, mudou?

**029** · 3:24 · **Lia** (excited, point) · Téo reage: excited · tela: terminal

> Nem uma linha. A correção coube inteira no contrato do frete. [Passo três, verde].

## 5 · ISP e DIP

**030** · 3:31 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `passo4/notifications.ts`

> Agora a comunicação. Um dono só, então todos os e-mails da loja moram aqui.
>
> ⏸ 4s — "Leia o código"

**031** · 3:40 · **Téo** (skeptical, point) · Lia reage: happy · tela: (continua)

> Mas o checkout só usa [um desses três].

**032** · 3:43 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Coeso pro dono, gordo pro cliente. A responsabilidade única olha pra quem muda a classe. A segregação de interfaces olha pra quem usa.

**033** · 3:53 · **Téo** (happy, point) · Lia reage: happy · tela: código `passo4/order-service.ts` (novidades em verde vs `passo3/order-service.ts`)

> Passo quatro: o checkout declara o papel de que precisa. [Confirmar pedido], um método.
>
> ⏸ 7s — "Leia o código"

**034** · 4:06 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Mas ele ainda [cria o banco e as notificações] ali dentro, né?

**035** · 4:10 · **Lia** (concerned, point) · Téo reage: concerned · tela: graph

> E é por isso que todo teste do checkout [ainda passa pelo banco e pelo e-mail]. A seta aponta do checkout pra infra.

**036** · 4:18 · **Lia** (happy, point) · Téo reage: thinking · tela: código `passo5/order-service.ts`

> Último passo, inversão de dependência. O checkout [define as portas] e [recebe quem implementa].
>
> ⏸ 7s — "Leia o código"

**037** · 4:32 · **Téo** (surprised, point) · Lia reage: happy · tela: graph

> Agora a seta vem da infra: o repositório e as notificações implementam as portas do checkout.

**038** · 4:38 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> E só a raiz de composição conhece todo mundo. É o único lugar que liga banco e e-mail de verdade.

**039** · 4:45 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> [Passo quatro, passo cinco]... [quarenta e dois de quarenta e dois]!

**040** · 4:50 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> E olha o tempo. Com a nossa infra simulada, meio segundo por versão. No passo cinco, com dois dublês, menos de três milissegundos.

**041** · 4:59 · **Téo** (skeptical, raise) · Lia reage: happy · tela: Lia e Téo conversando

> E o banco de verdade, ninguém testa mais?

**042** · 5:02 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Testa, com um teste de integração pela raiz de composição. Um teste lento no lugar certo, em vez de todos passando pela rede.

## 6 · As medidas

**043** · 5:10 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> Agora os números. [O método checkout] caiu de vinte e uma pra nove linhas. [Setas do checkout até a infra]: de uma pra zero. [O contrato] foi de quinhentos milissegundos pra menos de três. [E o total de linhas]...

**044** · 5:26 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> Peraí. Quase quatro vezes mais linhas? Isso é melhoria?

**045** · 5:31 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> SOLID não promete menos código. Promete mudança mais barata: cada arquivo muda por um motivo, e cada regra se testa sem a infra.

**046** · 5:40 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Mais linhas pra escrever uma vez, menos linhas pra ler a cada mudança.

## 7 · Os 4 sinais

**047** · 5:45 · **Lia** (happy, point) · Téo reage: excited · tela: terminal

> E os quatro sinais da aula um? Um teste pra cada. [Rigidez]: frete novo sem tocar no checkout. [Fragilidade]: a Black Friday não mexe no frete grátis.

**048** · 5:57 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [Imobilidade]: o carrinho usa o frete sozinho. [Viscosidade]: testar o checkout pede dois dublês de uma linha.

**049** · 6:06 · **Téo** (skeptical, raise) · Lia reage: happy · tela: inbox

> Falta uma coisa. E os três mil e-mails?

**050** · 6:09 · **Lia** (happy, point) · Téo reage: surprised · tela: terminal

> Olha a trilha do carrinho agora: [uma dependência só], a regra de frete. Ele não alcança o e-mail nem se quiser.

**051** · 6:18 · **Téo** (excited, celebrate) · Lia reage: excited · tela: inbox

> O teste faz três mil consultas de frete... [e zero e-mails]. Caso encerrado!
>
> _voz:_ O teste faz três mil consultas de frete... <pausa 0.3> [e zero e-mails]. Caso encerrado!

**052** · 6:24 · **Téo** (happy, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Tá bom, perdi o café.

**053** · 6:26 · **Lia** (happy, explain) · Téo reage: thinking · tela: symptoms

> Perdeu. Mas repara como: nenhum passo foi grande, e cada um foi conferido antes do próximo.

**054** · 6:33 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> Refatorar é mudar o desenho sem mudar o comportamento. Um passo verde de cada vez.
>
> _voz:_ Refatorar é mudar o desenho sem mudar o comportamento. <pausa 0.4> Um passo verde de cada vez.

## 8 · Desafio

**055** · 6:39 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: pega aquele arquivo da aula um e [escreve a rede primeiro], as regras virando testes.

**056** · 6:46 · **Lia** (happy, explain) · tela: (continua)

> Depois, [escolhe um princípio e dá um passo só]. [Ficou verde? Aí sim, o próximo].

**057** · 6:52 · **Lia** (thinking, point) · Téo reage: surprised · tela: cartão "Última aula"

> Na última aula do curso: quando não fazer nada disso. Porque às vezes, a melhor refatoração é nenhuma.

**058** · 6:59 · **Téo** (surprised, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Depois de vinte e três aulas, você vai me dizer pra não usar SOLID?

**059** · 7:04 · **Lia** (excited, wave) · Téo reage: skeptical, neutral · tela: (continua)

> Às vezes. Até a próxima!
