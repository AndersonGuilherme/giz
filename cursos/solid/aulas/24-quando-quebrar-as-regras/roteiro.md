# Roteiro: Aula 24 · Quando quebrar as regras

> GERADO de `roteiro.ts` — edite lá e rode o build. 47 falas · 778 palavras · 19 cenas · duração 5:29 · uma cena nova a cada 17 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O exagero

**001** · 0:00 · **Téo** (excited, celebrate) · Lia reage: skeptical · tela: terminal

> Apliquei os cinco princípios no script do relatório! [De doze linhas pra cinquenta e uma, em sete arquivos].

**002** · 0:07 · **Lia** (skeptical, think) · Téo reage: happy · tela: (continua)

> Bonito. E quantas vezes esse script mudou no último ano?

**003** · 0:11 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> Hum... nenhuma.
>
> _voz:_ Hum... <pausa 0.4> nenhuma.

**004** · 0:14 · **Lia** (happy, explain) · Téo reage: confused · tela: title

> Então a pergunta de hoje é a mais difícil do curso: quando não usar nada disso.

## 2 · O script

**005** · 0:19 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `relatorio.ts`

> Olha o original. Um dono, o financeiro. Roda toda noite e não muda há um ano.
>
> ⏸ 4s — "Leia o código"

**006** · 0:30 · **Téo** (happy, point) · Lia reage: skeptical · tela: código `relatorio-solid/export-service.ts`

> E o meu tem porta pra tudo: [fonte, filtro, formato e saída]. Se um dia virar banco, ou planilha...
>
> ⏸ 6s — "Leia o código"

**007** · 0:43 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Se um dia. Cada porta é uma aposta de que aquilo vai mudar. Sem mudança à vista, você paga hoje por um benefício que talvez nunca chegue.

**008** · 0:52 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> É o YAGNI da aula doze, de novo.
>
> _voz:_ É o iágni da aula doze, de novo.

**009** · 0:55 · **Lia** (happy, point) · Téo reage: surprised · tela: terminal

> E repara: [os dois passam no mesmo teste]. Mesmo comportamento, quatro vezes mais coisa pra ler.

**010** · 1:02 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> E se ele começar a mudar toda semana?

**011** · 1:05 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Aí sim: rede de testes e um princípio por passo, como na aula passada. Você refatora quando a mudança chega, não antes.

## 3 · O protótipo

**012** · 1:13 · **Téo** (excited, explain) · Lia reage: thinking · tela: cartão "Pré-venda de um produto novo"

> Segundo caso: uma página de pré-venda. [A pergunta é se alguém compra]. [Fica uma semana no ar] [e vai pro lixo].

**013** · 1:22 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Aqui o que importa é a resposta, e rápido. Código que vai pro lixo não precisa ser fácil de mudar.

**014** · 1:29 · **Téo** (excited, raise) · Lia reage: skeptical · tela: (continua)

> Então protótipo pode ser bagunçado?

**015** · 1:31 · **Lia** (skeptical, explain) · Téo reage: thinking · tela: (continua)

> Pode ser simples: um arquivo, sem portas, sem camadas. Bagunçado a ponto de você não confiar na resposta, não.

**016** · 1:39 · **Téo** (skeptical, raise) · Lia reage: concerned · tela: (continua)

> E se a pré-venda der certo e ninguém jogar fora?

**017** · 1:43 · **Lia** (concerned, point) · Téo reage: thinking · tela: versus

> Esse é o perigo de verdade. Protótipo precisa de data de validade escrita. Se sobreviver, ganha a rede e os passos da aula passada.

## 4 · O laço quente

**018** · 1:52 · **Téo** (thinking, think) · Lia reage: skeptical · tela: Lia e Téo conversando

> E desempenho? Dizem que interface e polimorfismo deixam tudo mais lento.

**019** · 1:58 · **Lia** (happy, point) · Téo reage: thinking · tela: código `hot-path.ts`

> Então a gente mede. Um milhão de preços na virada da Black Friday, de três jeitos, todos com o mesmo total.
>
> ⏸ 9s — "Leia o código"

**020** · 2:14 · **Téo** (surprised, raise) · Lia reage: skeptical · tela: terminal

> Regras plugáveis: [oitenta e seis milissegundos]. Escrito à mão: [um e meio]. Quase sessenta vezes!

**021** · 2:23 · **Lia** (skeptical, point) · Téo reage: surprised · tela: (continua)

> Agora olha [a linha do meio]: as mesmas regras plugáveis, perguntadas uma vez só, antes do laço. Um e meio também.

**022** · 2:31 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> Então o custo nem era a abstração?

**023** · 2:34 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Era perguntar um milhão de vezes uma coisa que não muda por item. A abstração fica na borda, e o miolo do laço fica direto.

**024** · 2:42 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> E se a regra mudasse a cada item?

**025** · 2:45 · **Lia** (thinking, think) · Téo reage: happy · tela: (continua)

> Aí, num laço desses, escrever à mão pode valer. Mas com a medição na mão. No checkout, com três itens, essa diferença nem aparece.

## 5 · Equipe e prazo

**026** · 2:54 · **Téo** (concerned, shrug) · Lia reage: thinking · tela: cartão "Lançamento na sexta"

> Último caso: lançamento na sexta, equipe de duas pessoas, e ninguém ali conhece portas e adaptadores.

**027** · 3:01 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Um desenho que a equipe não entende não é limpo. É só difícil de outro jeito. O desenho certo é o que o seu time consegue manter.

**028** · 3:10 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Dívida consciente"

> Então você pega o atalho, mas como decisão. [Em voz alta]. [Com teste nas regras de negócio]. [E com data pra pagar].

**029** · 3:19 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> Diferente do dryRun da aula um, que ninguém decidiu. Só foi ficando.
>
> _voz:_ Diferente do drai ran da aula um, que ninguém decidiu. Só foi ficando.

## 6 · A régua

**030** · 3:24 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> Percebeu o padrão? [O script] e [o protótipo] não mudam. [O laço quente] muda pouco e roda muito. [O checkout] muda toda semana.

**031** · 3:33 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Então a pergunta é sempre a mesma: isso vai mudar, e quanto custa mudar?

**032** · 3:38 · **Téo** (skeptical, shrug) · Lia reage: thinking · tela: (continua)

> Só que eu não leio o futuro. Como eu sei o que vai mudar?

**033** · 3:42 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Ninguém lê. Por isso a gente olha pra trás: o que mudou nos últimos meses tende a mudar de novo. O histórico de commits é a melhor bola de cristal.
>
> _voz:_ Ninguém lê. Por isso a gente olha pra trás: o que mudou nos últimos meses tende a mudar de novo. O histórico de cômites é a melhor bola de cristal.

**034** · 3:53 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Lembra da aula um? Código apodrece quando cada mudança fica mais cara. SOLID existe pra baixar esse custo. Onde não tem mudança, não tem custo pra baixar.

**035** · 4:04 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> SOLID é ferramenta, não religião. Use onde a mudança custa caro.
>
> _voz:_ Sólid é ferramenta, <pausa 0.2> não religião. <pausa 0.4> Use onde a mudança custa caro.

## 7 · O curso todo

**036** · 4:10 · **Téo** (happy, explain) · Lia reage: happy · tela: inbox

> Lembra como tudo começou? Três mil e-mails de um pedido que ninguém fez.

**037** · 4:15 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "24 episódios"

> [Daí vieram os quatro sinais], coesão, dependências e abstração. [Responsabilidade única]: um motivo pra mudar.

**038** · 4:23 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [Aberto e fechado]: estender sem editar. [Liskov]: todo subtipo cumpre o contrato.

**039** · 4:31 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> [Interfaces do tamanho de quem usa]. [E a seta apontando pro que muda menos].

**040** · 4:36 · **Téo** (happy, celebrate) · Lia reage: excited · tela: (continua)

> [E no fim, tudo junto], com teste verde a cada passo. E a coragem de não usar.

**041** · 4:42 · **Lia** (excited, point) · Téo reage: happy · tela: cartão "Desafio final"

> O desafio final: [escolhe um arquivo de verdade] do seu projeto. [E pergunta: muda, quem pede, com que frequência?]

**042** · 4:50 · **Téo** (happy, explain) · Lia reage: happy · tela: (continua)

> [Muda muito? Rede de testes e um passo por vez]. [Não muda? Deixa simples e segue a vida].

## 8 · Até logo

**043** · 4:58 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "O que estudar agora"

> E pra continuar: [testes e desenvolvimento guiado por testes], que é a rede de tudo isso. [O livro de refatoração do Martin Fowler].
>
> _voz:_ E pra continuar: [testes e desenvolvimento guiado por testes], que é a rede de tudo isso. [O livro de refatoração do Martin Fáuler].

**044** · 5:07 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [Object Calisthenics], pra treinar o olho. [E Clean Architecture], que é esse curso na escala do sistema inteiro.
>
> _voz:_ [Óbjequit calistênics], pra treinar o olho. [E a Arquitetura Limpa], que é esse curso na escala do sistema inteiro.

**045** · 5:14 · **Téo** (happy, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Vinte e quatro aulas... e eu ainda te devo um café.

**046** · 5:18 · **Lia** (happy, explain) · Téo reage: excited · tela: (continua)

> Esse eu vou cobrar. E você aí, obrigada por investigar com a gente até o fim.

**047** · 5:24 · **Téo** (excited, wave) · Lia reage: happy, wave · tela: (continua)

> Agora vai lá abrir aquele arquivo. A gente se vê na próxima investigação!
