# Roteiro: Aula 19 · Trocar o banco deveria mexer no desconto?

> GERADO de `roteiro.ts` — edite lá e rode o build. 52 falas · 751 palavras · 20 cenas · duração 5:26 · uma cena nova a cada 16 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A decisão

**001** · 0:00 · **Téo** (excited, raise) · Lia reage: thinking · tela: cartão "Decisão do time"

> Decisão do time: [trocar de banco] e [trocar o provedor de e-mail].

**002** · 0:04 · **Lia** (skeptical, raise) · Téo reage: thinking, think · tela: (continua)

> Pergunta pra você: isso deveria mexer na regra de desconto?
>
> _voz:_ Pergunta pra você: <pausa 0.2> isso deveria mexer no desconto?
>
> ⏸ 3s — "Pense"

**003** · 0:12 · **Téo** (happy, shrug) · Lia reage: skeptical · tela: (continua)

> Não, né? Desconto VIP é dez por cento em qualquer banco.

**004** · 0:16 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Deveria ser assim. Então vamos conferir no código, e não na intuição.

## 2 · O suspeito

**005** · 0:21 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `domain/order-service.ts`

> Esse é o OrderService fino que saiu do módulo de responsabilidade única. Ele só orquestra.
>
> ⏸ 7s — "Leia o código"

**006** · 0:35 · **Téo** (happy, point) · Lia reage: skeptical · tela: (continua)

> Tá enxuto: calcula, grava e avisa. Qual é o problema?

**007** · 0:40 · **Lia** (skeptical, point) · Téo reage: surprised · tela: (continua)

> [Os dois últimos imports]. E [os dois new] logo embaixo.
>
> _voz:_ [Os dois últimos imports]. <pausa 0.2> E [os dois niú] logo embaixo.

**008** · 0:44 · **Téo** (skeptical, shrug) · Lia reage: happy · tela: (continua)

> Ele cria o Postgres e o SMTP sozinho. Mas alguém tem que criar, né?
>
> _voz:_ Ele cria o póstgres e o ésse eme tê pê sozinho. <pausa 0.2> Mas alguém tem que criar, né?

**009** · 0:50 · **Lia** (happy, explain) · Téo reage: surprised · tela: Lia e Téo conversando

> Você disse quase isso na aula três, quando o teste do frete caiu por causa do e-mail. A gente prometeu virar aquela seta.

**010** · 0:58 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Chegou a hora. Mas antes: qual lado é qual?

## 3 · Política × detalhe

**011** · 1:02 · **Lia** (thinking, explain) · Téo reage: thinking, think · tela: table

> Um teste simples. Se a loja funcionasse no papel e caneta, essa coisa continuaria existindo?
>
> _voz:_ Um teste simples. <pausa 0.2> Se a loja funcionasse no papel e caneta, essa coisa continuaria existindo?

**012** · 1:08 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> [Desconto VIP]: continua. O vendedor anota dez por cento no bloquinho.

**013** · 1:14 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> [Frete grátis acima de duzentos reais], também. E [avisar o cliente] que o pedido foi confirmado, também.

**014** · 1:21 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> Agora, [o INSERT na tabela de pedidos] e [o SMTP]... no papel, nem existem.
>
> _voz:_ Agora, [o ínsert na tabela de pedidos] e [o ésse eme tê pê]... <pausa 0.2> no papel, nem existem.

**015** · 1:27 · **Lia** (excited, explain) · Téo reage: thinking · tela: (continua)

> O que sobrevive ao papel é política: alto nível. O que só existe por causa do computador é detalhe: baixo nível.

**016** · 1:36 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Alto nível de importância?

**017** · 1:38 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> De distância da entrada e da saída. Baixo nível fica colado no disco, na rede, no protocolo. Alto nível fica longe: só regra.

**018** · 1:48 · **Téo** (thinking, think) · Lia reage: excited · tela: (continua)

> Pera. Avisar o cliente é política, mas mandar por SMTP é detalhe. A mesma ação tem dois níveis?
>
> _voz:_ Pera. <pausa 0.2> Avisar o cliente é política, mas mandar por ésse eme tê pê é detalhe. <pausa 0.2> A mesma ação tem dois níveis?

**019** · 1:55 · **Lia** (excited, point) · Téo reage: happy · tela: (continua)

> Tem. Avisar é a decisão do negócio. Por qual canal é o jeito de hoje: amanhã pode ser mensagem no celular.

## 4 · A trilha

**020** · 2:04 · **Lia** (thinking, point) · Téo reage: thinking · tela: terminal

> Agora a trilha, com o script da aula três. [Seis dependências].

**021** · 2:09 · **Téo** (surprised) · Lia reage: concerned · tela: (continua)

> Quatro das seis são infra. E a infra ainda puxa o pool do banco e o provedor de e-mail.

**022** · 2:15 · **Lia** (concerned, explain) · Téo reage: thinking · tela: graph

> Desenhando: a política em cima, os detalhes embaixo. E [as setas descem]. A política depende dos detalhes.

**023** · 2:23 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Mas não é assim que tem que ser? Quem usa aponta pra quem é usado.

**024** · 2:28 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> É o jeito natural de escrever, por isso é tão comum. Só que, como a gente viu na aula três, a mudança anda contra a seta.

**025** · 2:36 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> Então toda mudança no banco sobe até a regra do pedido.

**026** · 2:40 · **Lia** (happy, explain) · Téo reage: thinking · tela: versus

> A política muda quando o negócio muda. O detalhe muda quando a tecnologia muda. Amarrados assim, a política herda os dois motivos.

## 5 · O preço

**027** · 2:49 · **Lia** (skeptical, point) · Téo reage: surprised · tela: terminal

> Quer ver o custo? Um teste do desconto VIP, passando pelo checkout. [Sem banco configurado].
>
> _voz:_ Quer ver o custo? <pausa 0.2> Um teste do desconto VIP, passando pelo chéquiaute. <pausa 0.2> [Sem banco configurado].

**028** · 2:56 · **Téo** (surprised, raise) · Lia reage: concerned · tela: (continua)

> Pra testar dez por cento, eu preciso de um banco?

**029** · 2:59 · **Lia** (concerned, shrug) · Téo reage: thinking · tela: (continua)

> E de uma chave de e-mail. O teste nem olha o banco, mas carrega quem carrega o banco.

**030** · 3:05 · **Téo** (thinking, think) · Lia reage: happy · tela: terminal

> E se eu testar a regra direto, sem o serviço?

**031** · 3:08 · **Lia** (happy, point) · Téo reage: excited · tela: (continua)

> [Três testes, nenhum banco], nenhuma chave. A política sozinha é limpa.

**032** · 3:13 · **Téo** (happy, explain) · Lia reage: happy · tela: (continua)

> Então o problema não está nas regras. Está no arquivo que junta as regras com a infra.

## 6 · A tentação

**033** · 3:19 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `domain/order-service.factory.ts` (novidades em verde vs `domain/order-service.ts`)

> Já sei. Escondo os new numa fábrica da infra. O serviço só pede: me dá um repositório.
>
> _voz:_ Já sei. <pausa 0.2> Escondo os niú numa fábrica da infra. O serviço só pede: me dá um repositório.
>
> ⏸ 8s — "Leia o código"

**034** · 3:35 · **Lia** (skeptical, raise) · Téo reage: thinking, think · tela: (continua)

> Será que o serviço ainda importa a infra?
>
> ⏸ 3s — "Siga o import"

**035** · 3:41 · **Lia** (concerned, point) · Téo reage: surprised · tela: terminal

> Importa. E agora são [sete dependências]: uma a mais que antes.

**036** · 3:46 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Escondi o new e ganhei mais uma seta.
>
> _voz:_ Escondi o niú e ganhei mais uma seta.

**037** · 3:49 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Esconder não é inverter. A seta continua descendo do domínio pra infra, só ficou mais comprida.

**038** · 3:56 · **Téo** (thinking, raise) · Lia reage: happy · tela: Lia e Téo conversando

> E uma interface do repositório, lá na pasta da infra?

**039** · 3:59 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Tá esquentando. Interface é o caminho, mas o endereço dela decide tudo. Se ela mora na infra, o domínio continua importando a infra.

## 7 · A lição

**040** · 4:08 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "Inversão de dependência"

> Isso tem nome: princípio da inversão de dependência. A primeira metade diz: [alto nível não deve depender de baixo nível].

**041** · 4:18 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Mas a política precisa gravar e avisar. Como ela usa sem depender?

**042** · 4:23 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> Com a segunda metade: [os dois dependem de uma abstração]. E quem escreve essa abstração é a política.

**043** · 4:31 · **Téo** (happy, think) · Lia reage: happy · tela: cartão "Resumo"

> Então: [política é o que sobrevive ao papel]. [Banco, protocolo e provedor são detalhe].

**044** · 4:37 · **Lia** (happy, point) · tela: (continua)

> [Política que importa detalhe muda por dois motivos]. E [esconder o new não inverte nada].
>
> _voz:_ [Política que importa detalhe muda por dois motivos]. <pausa 0.2> E [esconder o niú não inverte nada].

**045** · 4:44 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> E a pergunta do começo? Trocar de banco mexe no desconto?

**046** · 4:48 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Na linha do desconto, não. Mas mexe no arquivo que orquestra o pedido e em todo teste que passa por ele. É por isso que dói.

**047** · 4:57 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> Regra de negócio não deveria saber em que banco ela mora.

## 8 · Desafio

**048** · 5:01 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [pega um serviço] do seu projeto e [faz o teste do papel] em cada import.

**049** · 5:07 · **Lia** (happy, explain) · tela: (continua)

> Depois [marca as setas que descem] da política pro detalhe. Conta quantas são.

**050** · 5:12 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula, a gente finalmente vira essa seta: o domínio define as portas, e a infra se encaixa nelas.

**051** · 5:20 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Dezesseis aulas esperando essa seta. Tô pronto.

**052** · 5:24 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
