# Roteiro: Aula 20 · Gravar no banco sem importar o banco

> GERADO de `roteiro.ts` — edite lá e rode o build. 51 falas · 729 palavras · 22 cenas · duração 5:40 · uma cena nova a cada 15 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O paradoxo

**001** · 0:00 · **Téo** (skeptical, raise) · Lia reage: happy · tela: graph

> O checkout precisa gravar no Postgres. Sem importar o Postgres. Será que dá?
>
> _voz:_ O chéquiaute precisa gravar no póstgres. <pausa 0.2> Sem importar o póstgres. <pausa 0.2> Será que dá?
>
> ⏸ 3s — "Pense"

**002** · 0:09 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Dá. E no fim da aula, quem vai importar alguém é o Postgres.
>
> _voz:_ Dá. <pausa 0.2> E no fim da aula, quem vai importar alguém é o póstgres.

**003** · 0:14 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> O banco importando o domínio? Isso tá de cabeça pra baixo.

**004** · 0:18 · **Lia** (excited, point) · Téo reage: excited · tela: title

> A ideia é exatamente essa. Hoje a gente vira a seta prometida lá na aula três.

## 2 · Antes

**005** · 0:24 · **Lia** (thinking, point) · Téo reage: thinking · tela: terminal

> Onde a gente parou: [seis dependências], quatro delas na infra.

**006** · 0:29 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> E a regra do pedido mudando por motivo de banco. Lembro bem.

**007** · 0:34 · **Lia** (happy, explain) · Téo reage: thinking · tela: cartão "Três movimentos"

> Pra virar, são três movimentos. [O domínio escreve as portas]. [O serviço recebe as portas]. [A infra implementa].

**008** · 0:43 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Só três? Parece fácil demais.

**009** · 0:46 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> O difícil é o primeiro. Quase todo mundo erra quem escreve a porta.

## 3 · A porta

**010** · 0:51 · **Lia** (happy, point) · Téo reage: thinking · tela: código `depois/domain/ports.ts`

> Movimento um: o domínio escreve, na língua dele, do que precisa. Uma porta pra guardar o pedido e outra pra avisar o cliente.
>
> ⏸ 4s — "Leia o código"

**011** · 1:03 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> Repara: [salvar um pedido], e não INSERT INTO. [Pedido confirmado], e não "mandar por SMTP".
>
> _voz:_ Repara: [salvar um pedido], e não ínsert íntu. <pausa 0.2> [Pedido confirmado], e não mandar por ésse eme tê pê.

**012** · 1:11 · **Lia** (excited, explain) · Téo reage: thinking · tela: (continua)

> Esse é o coração da coisa. A porta é desenhada por quem usa, não por quem implementa. Ela fala de pedido, não de tabela.

**013** · 1:19 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E onde esse arquivo mora? Na infra?

**014** · 1:23 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> Na pasta do domínio, do lado do serviço. O endereço faz parte da solução. Guarda isso, que volta daqui a pouco.

## 4 · O encaixe

**015** · 1:31 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `depois/domain/order-service.ts` (novidades em verde vs `antes/domain/order-service.ts`)

> Movimento dois: o serviço não cria mais nada. Ele recebe as portas no construtor.
>
> ⏸ 9s — "Leia o código"

**016** · 1:47 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [Nos imports, só regra e porta]. E [nenhum new].
>
> _voz:_ [Nos imports, só regra e porta]. <pausa 0.2> E [nenhum niú].

**017** · 1:50 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> E [a linha que grava] quase não mudou. Ela só não sabe mais quem está do outro lado.

**018** · 1:56 · **Lia** (happy, point) · Téo reage: surprised · tela: código `depois/infra/postgres-order-repository.ts`

> Movimento três: o Postgres [implementa a porta do domínio].
>
> _voz:_ Movimento três: o póstgres [implementa a porta do domínio].
>
> ⏸ 4s — "Leia o código"

**019** · 2:05 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> E [o import aponta pro domínio]! A infra é que conhece o domínio agora.

**020** · 2:10 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> E o SQL ficou aqui, onde é detalhe. Trocou de banco? Troca este arquivo. O domínio nem fica sabendo.
>
> _voz:_ E o ésse quê éle ficou aqui, onde é detalhe. <pausa 0.2> Trocou de banco? Troca este arquivo. O domínio nem fica sabendo.

## 5 · Depois

**021** · 2:18 · **Lia** (thinking, point) · Téo reage: excited · tela: terminal

> Agora a prova, com o mesmo script. [Três dependências], todas no domínio.

**022** · 2:24 · **Téo** (excited, point) · Lia reage: happy · tela: terminal

> E o Postgres? [Aponta pra porta do domínio].
>
> _voz:_ E o póstgres? <pausa 0.2> [Aponta pra porta do domínio].

**023** · 2:27 · **Lia** (excited, explain) · Téo reage: surprised · tela: graph

> No desenho, antes as setas desciam. [Agora a infra aponta pra cima], pras portas do domínio.

**024** · 2:34 · **Téo** (excited, celebrate) · Lia reage: happy · tela: (continua)

> A seta virou! Por isso o nome: inversão de dependência.

**025** · 2:39 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Com um detalhe fino. Na hora de rodar, o serviço ainda chama o Postgres. Mas no código, quem conhece quem virou do avesso.
>
> _voz:_ Com um detalhe fino. <pausa 0.2> Na hora de rodar, o serviço ainda chama o póstgres. <pausa 0.2> Mas no código, quem conhece quem virou do avesso.

**026** · 2:48 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Tá, mas alguém ainda tem que dar o new no Postgres, né?
>
> _voz:_ Tá, mas alguém ainda tem que dar o niú no póstgres, né?

**027** · 2:51 · **Lia** (happy, point) · Téo reage: thinking · tela: código `depois/main.ts`

> Alguém na borda: um arquivo só, que conhece as duas pontas e liga uma na outra. Na próxima aula ele ganha nome.
>
> ⏸ 4s — "Leia o código"

**028** · 3:03 · **Téo** (excited, raise) · Lia reage: happy · tela: terminal

> E o teste do checkout? [Sem banco e sem chave].
>
> _voz:_ E o teste do chéquiaute? <pausa 0.2> [Sem banco e sem chave].

**029** · 3:07 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Qualquer objeto que cumpra a porta serve. Até um de duas linhas, escrito ali no próprio teste.

**030** · 3:14 · **Téo** (thinking, raise) · Lia reage: happy · tela: código `depois/infra/api-notifier.ts`

> E aquela decisão do time, de trocar o SMTP por um provedor via API?
>
> _voz:_ E aquela decisão do time, de trocar o ésse eme tê pê por um provedor via a pê í?
>
> ⏸ 5s — "Leia o código"

**031** · 3:24 · **Lia** (happy, point) · Téo reage: excited · tela: (continua)

> Um arquivo novo na infra, que [implementa a mesma porta]. No main, troca uma palavra: o nome da classe.
>
> _voz:_ Um arquivo novo na infra, que [implementa a mesma porta]. <pausa 0.2> No méin, troca uma palavra: o nome da classe.

**032** · 3:32 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> E quanto muda no domínio?

**033** · 3:34 · **Lia** (excited, explain) · Téo reage: excited · tela: (continua)

> Nem um caractere. Nem a regra, nem o serviço, nem os testes do pedido. Era isso que a gente queria na aula passada.

## 6 · A tentação

**034** · 3:42 · **Téo** (concerned, shrug) · Lia reage: skeptical · tela: código `tentacao/domain/order-service.ts`

> Confissão: minha primeira versão foi essa. Interface, construtor, tudo bonito.
>
> ⏸ 6s — "Leia o código"

**035** · 3:54 · **Lia** (skeptical, raise) · Téo reage: concerned · tela: (continua)

> Tem interface, sim. Consegue ver o que está errado?
>
> ⏸ 4s — "Ache o problema"

**036** · 4:03 · **Lia** (thinking, point) · Téo reage: surprised · tela: (continua)

> [O endereço]: a interface mora na infra. E [o nome]: inserir linha, devolver linhas. É a língua do banco.

**037** · 4:12 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> Então se o banco mudar, a interface muda. E o domínio muda junto.

**038** · 4:17 · **Lia** (happy, point) · Téo reage: thinking · tela: terminal

> E dá pra pegar isso sozinho. Um teste de arquitetura: [nenhum arquivo do domínio importa a infra].

**039** · 4:24 · **Téo** (happy, point) · Lia reage: happy · tela: terminal

> [E no código de depois, passa]. Agora a seta tem um guarda.

## 7 · A lição

**040** · 4:28 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "Inversão de dependência"

> Agora o princípio inteiro. [Alto nível não depende de baixo nível]. [Os dois dependem de abstrações]. E [a abstração não depende de detalhe].

**041** · 4:39 · **Téo** (happy, shrug) · Lia reage: happy · tela: (continua)

> A terceira foi o meu erro: a interface falando em linhas de tabela.

**042** · 4:44 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> Mas então toda classe precisa de uma interface?

**043** · 4:47 · **Lia** (thinking, explain) · Téo reage: happy · tela: (continua)

> Não. Porta é pra fronteira com o que é volátil: banco, rede, e-mail, relógio, fornecedor. A regra de frete não precisa de porta pra ela mesma.

**044** · 4:58 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E o paradoxo do começo? O checkout grava no Postgres sem importar o Postgres?
>
> _voz:_ E o paradoxo do começo? <pausa 0.2> O chéquiaute grava no póstgres sem importar o póstgres?

**045** · 5:04 · **Lia** (excited, explain) · Téo reage: surprised · tela: (continua)

> Grava. Rodando, a chamada vai do serviço até o banco. No código, a seta vem do banco até a porta.

**046** · 5:11 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> A política define a porta. O detalhe se encaixa nela.

## 8 · Desafio

**047** · 5:15 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [escolhe um import] da política pra infra, daquele serviço da aula passada.

**048** · 5:21 · **Lia** (happy, explain) · tela: (continua)

> [Escreve a porta na língua do domínio]. Depois [faz a infra implementar], e compara a trilha antes e depois.

**049** · 5:28 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: inversão, injeção e container. Três ideias que quase todo mundo trata como uma só.

**050** · 5:36 · **Téo** (happy, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Eu jurava que era tudo a mesma coisa.

**051** · 5:39 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
