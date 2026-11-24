# Roteiro: Aula 05 · Quem pediu essa mudança?

> GERADO de `roteiro.ts` — edite lá e rode o build. 52 falas · 728 palavras · 16 cenas · duração 5:11 · uma cena nova a cada 19 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A pergunta

**001** · 0:00 · **Téo** (happy, explain) · Lia reage: skeptical · tela: quote

> O S do SOLID todo mundo sabe: uma classe deve fazer uma coisa só. Certo?
>
> _voz:_ O S do sólid todo mundo sabe: <pausa 0.2> uma classe deve fazer uma coisa só. Certo?

**002** · 0:06 · **Lia** (skeptical, shrug) · Téo reage: surprised · tela: (continua)

> É a frase mais repetida do SOLID. E não é isso que o princípio diz.
>
> _voz:_ É a frase mais repetida do sólid. <pausa 0.2> E não é isso que o princípio diz.

**003** · 0:11 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Como assim? Tá em todo tutorial!

**004** · 0:14 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Hoje a gente descobre o que é, de verdade, uma responsabilidade. E a resposta não está no código.

## 2 · Uma coisa só?

**005** · 0:21 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `order-service.ts`

> Lembra do checkout da aula dois? O frete já saiu. O resto continua aqui dentro.
>
> _voz:_ Lembra do chéquiaute da aula dois? O frete já saiu. O resto continua aqui dentro.
>
> ⏸ 7s — "Leia o código"

**006** · 0:35 · **Lia** (thinking, raise) · Téo reage: thinking, think · tela: (continua)

> Pergunta pra você: esse método faz uma coisa só?
>
> ⏸ 3s — "Pense"

**007** · 0:42 · **Téo** (happy, point) · Lia reage: skeptical · tela: (continua)

> Eu diria que sim: [ele finaliza o pedido]. Uma coisa.

**008** · 0:47 · **Lia** (skeptical, point) · Téo reage: surprised · tela: (continua)

> E dá pra dizer que faz cinco: [soma], [desconto], [frete], [gravação] e [e-mail].

**009** · 0:52 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então depende do zoom. De longe é uma coisa; de perto, são cinco.

**010** · 0:57 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> Pois é. E uma régua que muda com o zoom não decide nada. De bem longe, o sistema inteiro faz uma coisa só: vender.

**011** · 1:07 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Tá, então qual é a régua?

**012** · 1:09 · **Lia** (excited, raise) · Téo reage: surprised · tela: Lia e Téo conversando

> Troca a pergunta. Em vez de "o que essa classe faz", pergunta: quem pede pra ela mudar?

## 3 · O histórico

**013** · 1:16 · **Lia** (neutral, point) · Téo reage: thinking · tela: table

> Esse é o histórico do checkout num trimestre. É um cenário simulado, mas bem típico: [oito pedidos de mudança].
>
> _voz:_ Esse é o histórico do chéquiaute num trimestre. É um cenário simulado, mas bem típico: <pausa 0.2> [oito pedidos de mudança].

**014** · 1:23 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> Oito mudanças, mas em só quatro trechos. Dois pedidos em cada.

**015** · 1:28 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Agora você: quem pediu pra mudar o preço do expresso?
>
> ⏸ 3s — "Quem pediu?"

**016** · 1:36 · **Lia** (happy, point) · Téo reage: excited · tela: table

> A logística. Ninguém da comunicação acorda pensando no preço do expresso.

**017** · 1:41 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> E o formato dos valores no e-mail veio da [comunicação], claro.

**018** · 1:45 · **Lia** (excited, explain) · Téo reage: surprised · tela: (continua)

> Agora olha a coluna inteira: [cada trecho só recebeu pedido de um grupo].

## 4 · Os atores

**019** · 1:50 · **Lia** (happy, point) · Téo reage: thinking · tela: terminal

> Dá pra contar com código. Agrupando os pedidos por quem pediu: [quatro grupos].

**020** · 1:57 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Um ator por trecho. Parece que as fronteiras já estavam desenhadas!

**021** · 2:02 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Estavam. Só não no código. Financeiro, logística, comunicação e jurídico já pensam separado; a empresa já é dividida assim.

**022** · 2:11 · **Lia** (concerned, point) · Téo reage: concerned · tela: graph

> O problema é que [os quatro puxam a mesma classe].

**023** · 2:15 · **Téo** (concerned, shrug) · Lia reage: thinking · tela: (continua)

> Quatro grupos, um arquivo. Se dois pedem mudança na mesma semana, eu mexo no mesmo método duas vezes.

**024** · 2:22 · **Lia** (concerned, explain) · Téo reage: surprised · tela: (continua)

> E cada mudança de um põe em risco o código dos outros três. É a fragilidade da aula um, agora com nome e sobrenome.

## 5 · A definição

**025** · 2:29 · **Lia** (happy, explain) · Téo reage: thinking · tela: quote

> O próprio autor do princípio, Robert Martin, reescreveu a definição assim. Repara: não fala em fazer uma coisa.
>
> _voz:_ O próprio autor do princípio, Róbert Martin, reescreveu a definição assim. <pausa 0.3> Repara: não fala em fazer uma coisa.

**026** · 2:37 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E ator é uma pessoa?

**027** · 2:39 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Não. É um grupo de pessoas que quer o mesmo tipo de mudança. Um setor, um tipo de cliente, um time.

**028** · 2:47 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> E aquela história de "uma razão para mudar"? Também vale?

**029** · 2:51 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> É a mesma ideia, dita antes. A razão para mudar não é técnica: é alguém do outro lado pedindo.

**030** · 2:58 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Então "fazer uma coisa só" é conselho de função, não de classe!

**031** · 3:02 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Isso. Função pequena, que faz uma coisa, é ótimo conselho. Só não é o S do SOLID.
>
> _voz:_ Isso. Função pequena, que faz uma coisa, é ótimo conselho. <pausa 0.2> Só não é o S do sólid.

**032** · 3:09 · **Téo** (surprised, think) · Lia reage: skeptical · tela: (continua)

> Pera aí. Então uma classe pequena pode violar o princípio?

**033** · 3:14 · **Lia** (skeptical, explain) · Téo reage: surprised · tela: (continua)

> Pode. Dez linhas que calculam o desconto e montam o texto do e-mail já respondem a dois atores. E uma classe grande, com um ator só, pode estar ótima.

**034** · 3:24 · **Téo** (thinking, point) · Lia reage: happy · tela: (continua)

> Tamanho não é a régua. Quem pede é.

## 6 · Casos difíceis

**035** · 3:27 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> Caso difícil: trocar o provedor de e-mail. Ninguém do negócio pediu isso. Fui eu.

**036** · 3:34 · **Lia** (thinking, think) · Téo reage: surprised · tela: (continua)

> Pediu quem cuida da infraestrutura. E repara onde cai essa mudança: dentro do trecho do e-mail.

**037** · 3:42 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> Então o e-mail tem dois motivos pra mudar: o texto e o envio?

**038** · 3:46 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Tem. A comunicação cuida do texto; a infraestrutura, do envio. Esse corte a gente faz no módulo de inversão de dependência.

**039** · 3:55 · **Téo** (thinking, think) · Lia reage: thinking · tela: (continua)

> Outro: "mostrar a economia no e-mail". É do financeiro ou da comunicação?

**040** · 4:01 · **Lia** (skeptical, point) · Téo reage: surprised · tela: (continua)

> O número é do financeiro. Como ele aparece é da comunicação. Guarda esse detalhe: ele vai dar problema na próxima aula.

**041** · 4:10 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> E numa empresa pequena, onde o dono pede tudo? Aí é um ator só?

**042** · 4:15 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Mesmo sendo uma pessoa, ela troca de chapéu. Quando fala de preço, é o financeiro falando. Quando fala do texto, é o marketing.

## 7 · A lição

**043** · 4:24 · **Lia** (happy, explain) · Téo reage: happy · tela: cartão "Responsabilidade única"

> [Responsabilidade é sempre perante alguém]: um ator.

**044** · 4:28 · **Téo** (happy, point) · tela: (continua)

> [Ator é um grupo] que pede o mesmo tipo de mudança, não um cargo.

**045** · 4:32 · **Lia** (excited, point) · tela: (continua)

> E [os atores aparecem no histórico]. Não precisa adivinhar.

**046** · 4:36 · **Téo** (thinking, point) · Lia reage: happy · tela: versus

> Por isso a frase do começo não serve: "uma coisa só" depende do zoom. Ator, dá pra conferir.

**047** · 4:43 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> Não pergunte o que a classe faz. Pergunte quem pede para ela mudar.

## 8 · Desafio

**048** · 4:48 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [pega a classe que mais muda] no seu projeto.

**049** · 4:52 · **Lia** (happy, explain) · tela: (continua)

> [Lê os últimos dez commits] dela e [anota quem pediu cada um]. Quantos atores apareceram?

**050** · 4:58 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula, a gente corta o checkout nesses quatro eixos. E vê o estrago que um arredondamento compartilhado faz.
>
> _voz:_ Na próxima aula, a gente corta o chéquiaute nesses quatro eixos. E vê o estrago que um arredondamento compartilhado faz.

**051** · 5:06 · **Téo** (surprised, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Um arredondamento? Agora eu quero ver.

**052** · 5:10 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
