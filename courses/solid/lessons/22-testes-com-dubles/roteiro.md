# Roteiro: Aula 22 · Seis testes, cinco segundos: pra onde vai o tempo?

> GERADO de `roteiro.ts` — edite lá e rode o build. 48 falas · 749 palavras · 20 cenas · duração 5:31 · uma cena nova a cada 17 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O número

**001** · 0:00 · **Téo** (concerned, point) · Lia reage: thinking · tela: terminal

> Seis testes do checkout. [Quase cinco segundos].
>
> _voz:_ Seis testes do chéquiaute. <pausa 0.2> [Quase cinco segundos].

**002** · 0:04 · **Lia** (skeptical) · Téo reage: concerned · tela: (continua)

> E nenhum deles testa o banco ou o e-mail. Testam desconto, frete e se o cliente foi avisado.

**003** · 0:10 · **Téo** (concerned, shrug) · Lia reage: thinking · tela: (continua)

> Quase um segundo cada. Com seiscentos testes assim, dá mais de nove minutos esperando.

**004** · 0:16 · **Lia** (happy, explain) · Téo reage: surprised · tela: title

> Hoje esses mesmos seis vão rodar em milissegundos. Sem mudar uma linha do checkout.
>
> _voz:_ Hoje esses mesmos seis vão rodar em milissegundos. Sem mudar uma linha do chéquiaute.

## 2 · Onde o tempo vai

**005** · 0:22 · **Lia** (thinking, point) · Téo reage: surprised · tela: código `infra/latency.ts`

> A infra desta aula é simulada: [cento e vinte milissegundos] por ida ao banco, [oitocentos] pra enviar um e-mail.
>
> ⏸ 2s — "Leia o código"

**006** · 0:31 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Oitocentos pra um e-mail? Não é exagero?

**007** · 0:35 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Servidor de e-mail tem aperto de mão, autenticação, envio. Pode ser até mais. O ponto é: cada teste espera a rede, e nenhum se importa com ela.

**008** · 0:45 · **Téo** (excited, raise) · Lia reage: happy · tela: Lia e Téo conversando

> Só que desde a aula vinte o checkout recebe as portas. Dá pra entregar qualquer coisa pra ele.
>
> _voz:_ Só que desde a aula vinte o chéquiaute recebe as portas. Dá pra entregar qualquer coisa pra ele.

**009** · 0:52 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Dublês de teste"

> Isso. Com dublês, como no cinema: alguém entra no lugar do ator na cena perigosa. São cinco: [dummy], [stub], [fake], [spy] e [mock].
>
> _voz:_ Isso. Com dublês, como no cinema: alguém entra no lugar do ator na cena perigosa. <pausa 0.2> São cinco: [dâmi], [stâb], [fêique], [spái] e [móqui].

## 3 · Dummy e stub

**010** · 1:02 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `doubles.ts`

> Os três primeiros não se importam com como foram chamados.
>
> ⏸ 7s — "Leia o código"

**011** · 1:13 · **Lia** (skeptical, raise) · Téo reage: thinking, think · tela: (continua)

> Primeiro caso: pedido sem itens. O serviço recusa antes de gravar ou avisar. Do que esse teste precisa?
>
> ⏸ 3s — "Qual dublê?"

**012** · 1:24 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> De quase nada. [Um dummy]: só ocupa o lugar. Se alguém usar, explode.
>
> _voz:_ De quase nada. [Um dâmi]: só ocupa o lugar. <pausa 0.2> Se alguém usar, explode.

**013** · 1:31 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Isso. O construtor exige duas peças, mas o pedido é recusado antes de usar qualquer uma. Se um dummy explodir, a regra mudou.

**014** · 1:40 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [Stub]: resposta pronta. Mandou gravar? Devolve o número que eu escolhi, sempre.
>
> _voz:_ [Stâb]: resposta pronta. <pausa 0.2> Mandou gravar? Devolve o número que eu escolhi, sempre.

**015** · 1:46 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Perfeito pra desconto e frete. O teste quer saber o total; o banco só precisa responder alguma coisa.

## 4 · Fake

**016** · 1:54 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> [O fake] é diferente: ele funciona de verdade. Grava num mapa em memória, e busca de volta.
>
> _voz:_ [O fêique] é diferente: ele funciona de verdade. Grava num mapa em memória, e busca de volta.

**017** · 2:00 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então dá pra testar se o pedido foi gravado com o total certo, sem banco nenhum.

**018** · 2:06 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Isso. O fake guarda estado. É o dublê mais parecido com o real, e costuma ser o que mais rende.
>
> _voz:_ Isso. O fêique guarda estado. É o dublê mais parecido com o real, e costuma ser o que mais rende.

## 5 · Spy e mock

**019** · 2:13 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `doubles-calls.ts`

> Os outros dois olham justamente isso: como a peça foi chamada.
>
> ⏸ 6s — "Leia o código"

**020** · 2:24 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> [Spy] anota cada chamada, e o teste confere depois.
>
> _voz:_ [Spái] anota cada chamada, e o teste confere depois.

**021** · 2:28 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> E o [mock] já nasce sabendo o que esperar. Se vier diferente, falha na hora. No fim, [o teste pede pra ele conferir].
>
> _voz:_ E o [móqui] já nasce sabendo o que esperar. Se vier diferente, falha na hora. <pausa 0.2> No fim, [o teste pede pra ele conferir].

**022** · 2:36 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Spy e mock não são a mesma coisa?
>
> _voz:_ Spái e móqui não são a mesma coisa?

**023** · 2:39 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Quase. Muda onde mora a expectativa. No spy, ela fica no teste. No mock, fica dentro do dublê.
>
> _voz:_ Quase. Muda onde mora a expectativa. <pausa 0.2> No spái, ela fica no teste. No móqui, fica dentro do dublê.

**024** · 2:47 · **Téo** (concerned, point) · Lia reage: thinking · tela: terminal

> Escrevi esse aqui: VIP na Black Friday, e o e-mail mostra trinta reais de economia. [Falhou].

**025** · 2:54 · **Lia** (thinking, point) · Téo reage: confused · tela: (continua)

> O mock reclamou no instante em que o serviço avisou o cliente. A economia foi de sessenta reais, não trinta.
>
> _voz:_ O móqui reclamou no instante em que o serviço avisou o cliente. <pausa 0.2> A economia foi de sessenta reais, não trinta.

**026** · 3:01 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Ah! Desconto não acumula: na Black Friday vale o maior, vinte por cento. O errado era o meu teste.

**027** · 3:08 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Acontece. Às vezes o dublê pega o teste, e não o código. Pelo menos ele mostrou exatamente onde.

**028** · 3:16 · **Lia** (happy, point) · Téo reage: happy · tela: código `checkout.test.ts`

> No teste, cada um no seu papel. [Mock e stub] no desconto VIP. [O fake] no pedido gravado. [O spy] no aviso.
>
> _voz:_ No teste, cada um no seu papel. [Móqui e stâb] no desconto VIP. [O fêique] no pedido gravado. [O spái] no aviso.
>
> ⏸ 8s — "Leia o código"

## 6 · O resultado

**029** · 3:33 · **Téo** (excited, raise) · Lia reage: excited · tela: terminal

> Hora da verdade. [Os mesmos seis testes].

**030** · 3:36 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> Cento e cinquenta milissegundos no total, e quase tudo é o Node acordando. Cada teste, menos de um milissegundo.
>
> _voz:_ Cento e cinquenta milissegundos no total, e quase tudo é o nôude acordando. <pausa 0.2> Cada teste, menos de um milissegundo.

**031** · 3:44 · **Téo** (excited, celebrate) · Lia reage: happy · tela: (continua)

> De quase cinco segundos pra isso. E o checkout não mudou nada.
>
> _voz:_ De quase cinco segundos pra isso. E o chéquiaute não mudou nada.

**032** · 3:49 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> Mas pera. Se tudo é dublê, como eu sei que o Postgres funciona?
>
> _voz:_ Mas pera. <pausa 0.2> Se tudo é dublê, como eu sei que o póstgres funciona?

**033** · 3:54 · **Lia** (happy, point) · Téo reage: thinking · tela: código `repository-contract.ts`

> Com um teste de contrato. O mesmo teste roda contra o fake e contra o Postgres.
>
> _voz:_ Com um teste de contrato. O mesmo teste roda contra o fêique e contra o póstgres.
>
> ⏸ 4s — "Leia o código"

**034** · 4:03 · **Lia** (happy, point) · Téo reage: happy · tela: terminal

> [Os dois cumprem o contrato]. O do Postgres é lento, então roda em menos lugares: antes de publicar, não a cada tecla.
>
> _voz:_ [Os dois cumprem o contrato]. <pausa 0.2> O do póstgres é lento, então roda em menos lugares: antes de publicar, não a cada tecla.

**035** · 4:12 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então o contrato garante que o fake não mente.
>
> _voz:_ Então o contrato garante que o fêique não mente.

**036** · 4:16 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Garante que ele se comporta como o real naquilo que o domínio usa. O resto, o adaptador testa sozinho.

## 7 · A lição

**037** · 4:22 · **Téo** (excited, raise) · Lia reage: skeptical · tela: (continua)

> Então a regra é mockar tudo?
>
> _voz:_ Então a regra é usar móqui pra tudo?

**038** · 4:25 · **Lia** (concerned, explain) · Téo reage: thinking · tela: versus

> Cuidado. Teste que confere cada chamada interna quebra quando você refatora sem mudar o resultado. Fake e stub pra estado; spy e mock só quando a chamada é o próprio objetivo, como avisar o cliente.
>
> _voz:_ Cuidado. Teste que confere cada chamada interna quebra quando você refatora sem mudar o resultado. <pausa 0.2> Fêique e stâb pra estado; spái e móqui só quando a chamada é o próprio objetivo, como avisar o cliente.

**039** · 4:38 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Resumo"

> [Dummy ocupa, stub responde, fake funciona]. [Spy anota, mock já sabe o que esperar].
>
> _voz:_ [Dâmi ocupa, stâb responde, fêique funciona]. <pausa 0.2> [Spái anota, móqui já sabe o que esperar].

**040** · 4:45 · **Téo** (happy, point) · tela: (continua)

> [O contrato mantém o fake honesto]. E [a suíte caiu de quase cinco segundos pra menos de dois décimos].
>
> _voz:_ [O contrato mantém o fêique honesto]. <pausa 0.2> E [a suíte caiu de quase cinco segundos pra menos de dois décimos].

**041** · 4:52 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> E os cinco segundos do começo, eram o quê?

**042** · 4:54 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Espera. Rede, não regra. E só deu pra tirar a espera porque, duas aulas atrás, a seta foi virada.

**043** · 5:02 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> Teste a regra sem esperar a rede. A rede ganha o teste dela.

## 8 · Desafio

**044** · 5:07 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [mede a sua suíte]. Quanto daquele tempo é espera de rede?

**045** · 5:12 · **Lia** (happy, explain) · tela: (continua)

> [Troca uma peça lenta por um dublê], e [escreve o contrato] que mantém esse dublê honesto.

**046** · 5:18 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: o sistema de pedidos inteiro, refatorado com os cinco princípios. Com números de antes e depois.

**047** · 5:26 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> O checkout da aula um vai levar um susto.
>
> _voz:_ O chéquiaute da aula um vai levar um susto.

**048** · 5:29 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
