# Roteiro: Aula 06 · Dois centavos que ninguém pediu

> GERADO de `roteiro.ts` — edite lá e rode o build. 50 falas · 716 palavras · 19 cenas · duração 5:17 · uma cena nova a cada 17 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · Dois centavos

**001** · 0:00 · **Téo** (concerned, explain) · Lia reage: thinking · tela: inbox

> Desde terça, os pedidos com desconto saem com o valor errado. Esse aqui: [dois centavos a menos].

**002** · 0:07 · **Lia** (skeptical) · Téo reage: concerned · tela: (continua)

> Dois centavos parece pouco. Mas, arredondando pra real inteiro, o erro chega a cinquenta centavos por pedido.

**003** · 0:14 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> E o mais estranho: o financeiro não pediu mudança nenhuma.

**004** · 0:19 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então a pergunta é: quem mexeu no preço sem querer? E como impedir que isso aconteça de novo?

## 2 · A pista

**005** · 0:26 · **Lia** (thinking, point) · Téo reage: concerned · tela: terminal

> O teste do financeiro confirma: [cento e oitenta e oito e oitenta], em vez de oitenta e dois.

**006** · 0:33 · **Téo** (surprised, point) · Lia reage: thinking · tela: (continua)

> O desconto do VIP era vinte reais e noventa e oito. Virou vinte e um, redondinho.

**007** · 0:39 · **Lia** (skeptical, think) · Téo reage: thinking · tela: (continua)

> Redondinho demais pra ser acaso. Alguém arredondou pra real inteiro.

**008** · 0:44 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E arredondar o total é decisão de quem? Minha é que não é.

**009** · 0:48 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Do financeiro. Centavo no total é dinheiro de verdade: vai pra cobrança, pra nota fiscal, pro caixa.

## 3 · O commit

**010** · 0:56 · **Téo** (thinking, point) · Lia reage: thinking · tela: cartão "Único commit de terça"

> Só teve um commit na terça. [Pedido da comunicação]: [mostrar a economia do e-mail em reais redondos].

**011** · 1:04 · **Lia** (surprised, point) · Téo reage: surprised · tela: (continua)

> E ele [mexeu num arquivo só]. Nem abriu o cálculo de preço.

**012** · 1:08 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `money.changed.ts` (novidades em verde vs `money.ts`)

> A mudança inteira é essa linha, num helper de dinheiro.
>
> ⏸ 5s — "Leia o código"

**013** · 1:17 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Antes da Lia falar: como uma mudança pro e-mail chegou no preço?
>
> _voz:_ Antes da Lia falar: <pausa 0.2> como uma mudança pro e-mail chegou no preço?
>
> ⏸ 4s — "Ache a ligação"

## 4 · A linha dupla

**014** · 1:26 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `order-service.ts`

> Segue o desconto. [Ele passa pelo helper]... e daí [vai pra dois lugares].
>
> _voz:_ Segue o desconto. [Ele passa pelo helper]... <pausa 0.3> e daí [vai pra dois lugares].
>
> ⏸ 7s — "Leia o código"

**015** · 1:39 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> [Pro total], que é do financeiro. E [pro texto do e-mail], que é da comunicação.

**016** · 1:44 · **Lia** (concerned, explain) · Téo reage: concerned · tela: (continua)

> Uma linha servindo dois atores. Quem atendeu um lado não tinha como enxergar o outro.

**017** · 1:50 · **Téo** (concerned, shrug) · Lia reage: thinking · tela: (continua)

> E o teste do e-mail passou bonito: "você economizou vinte e um reais". Exatamente o que pediram.

**018** · 1:57 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Pra comunicação, a tarefa estava pronta. O estrago apareceu no eixo do vizinho.

**019** · 2:03 · **Téo** (confused, think) · Lia reage: happy · tela: (continua)

> Eixo do vizinho?

## 5 · Os eixos

**020** · 2:04 · **Lia** (happy, point) · Téo reage: thinking · tela: table

> Lembra dos atores da aula passada? Cada um é um [eixo de mudança]: uma direção pra onde o código é puxado.

**021** · 2:12 · **Téo** (thinking, point) · Lia reage: happy · tela: (continua)

> E o checkout está no cruzamento dos quatro.
>
> _voz:_ E o chéquiaute está no cruzamento dos quatro.

**022** · 2:15 · **Lia** (excited, explain) · Téo reage: excited · tela: (continua)

> Por isso o corte é simples: [uma classe por eixo]. O que o financeiro pede mora numa classe só dele.

**023** · 2:23 · **Lia** (happy, point) · Téo reage: thinking · tela: graph

> O desenho fica assim: quatro classes, cada uma com um dono. E o OrderService só orquestra.
>
> _voz:_ O desenho fica assim: <pausa 0.2> quatro classes, cada uma com um dono. E o órder sérvis só orquestra.

**024** · 2:30 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> O frete já saiu na aula dois. Faltam três.

## 6 · O corte

**025** · 2:34 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `price-calculator.ts`

> O preço fica com o financeiro. E repara no comentário: [o arredondamento ao centavo é regra dele].
>
> ⏸ 5s — "Leia o código"

**026** · 2:46 · **Téo** (happy, point) · Lia reage: happy · tela: código `order-notifier.ts`

> E o e-mail fica com a comunicação, com [o arredondamento dela]: reais redondos.
>
> ⏸ 4s — "Leia o código"

**027** · 2:56 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Pera. Agora tem dois arredondamentos no código. Isso não é duplicação?

**028** · 3:01 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Parece. Mas é duplicação acidental: dois trechos parecidos hoje, que mudam por motivos diferentes. Juntar os dois foi o que causou o bug.

**029** · 3:12 · **Téo** (confused, think) · Lia reage: happy · tela: (continua)

> Então "não se repita" não vale aqui?

**030** · 3:15 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Vale pra regra repetida. Pergunta: se o financeiro mudar o arredondamento dele, o e-mail tem que mudar junto? Não. Então não é a mesma regra.

**031** · 3:26 · **Lia** (happy, point) · Téo reage: thinking · tela: código `order-service.split.ts`

> E o checkout vira um maestro: pede o preço, o frete, grava e avisa.
>
> _voz:_ E o chéquiaute vira um maestro: <pausa 0.2> pede o preço, o frete, grava e avisa.
>
> ⏸ 5s — "Leia o código"

**032** · 3:36 · **Téo** (thinking, point) · Lia reage: happy · tela: (continua)

> E o frete continua [recebendo o subtotal], antes do desconto, como a regra da loja manda.

**033** · 3:42 · **Lia** (excited, point) · Téo reage: excited · tela: terminal

> Agora o pedido da comunicação, [no lugar certo].

**034** · 3:45 · **Téo** (excited, celebrate) · Lia reage: happy · tela: (continua)

> Vinte e um reais redondos no e-mail. E os dois centavos de volta no caixa!

**035** · 3:50 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> E o mistério fecha: os dois centavos vieram de uma linha que tinha dois donos.

**036** · 3:56 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> Olha o que muda no dia a dia. Antes, [qualquer pedido punha os quatro trechos em risco]. [Agora, só o trecho de quem pediu].

**037** · 4:04 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> E duas equipes podem mexer na mesma semana sem brigar pelo mesmo arquivo.

**038** · 4:09 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Mas e o OrderService? Ele também não muda nunca?
>
> _voz:_ Mas e o órder sérvis? Ele também não muda nunca?

**039** · 4:13 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Muda, quando o fluxo da venda muda: um passo novo, outra ordem. Esse é o eixo dele. O que ele não faz mais é conta, texto ou gravação.

## 7 · A lição

**040** · 4:23 · **Lia** (happy, explain) · Téo reage: happy · tela: cartão "Eixos de mudança"

> [Cada ator é um eixo] que puxa o código pra um lado.

**041** · 4:26 · **Téo** (happy, point) · tela: (continua)

> [Uma classe por eixo]. O serviço só orquestra.

**042** · 4:30 · **Lia** (skeptical, point) · tela: (continua)

> E [código parecido com donos diferentes] não é duplicação. É coincidência.

**043** · 4:36 · **Téo** (thinking, raise) · Lia reage: happy · tela: Lia e Téo conversando

> E como eu sei se o corte ficou bom?

**044** · 4:39 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Pega o próximo pedido de mudança. Se ele mexe numa classe só, o corte está bom. Se mexe em três, alguma fronteira está no lugar errado.

**045** · 4:48 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> Junte o que muda pelo mesmo motivo. Separe o que muda por motivos diferentes.

## 8 · Desafio

**046** · 4:54 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [acha um helper] que é chamado de vários lugares no seu projeto.

**047** · 4:59 · **Lia** (happy, explain) · tela: (continua)

> [Anota o ator de cada lugar] que chama. E pergunta: [se um mudar, o outro tem que mudar junto]?

**048** · 5:06 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: como fazer esse corte num sistema em produção, um passo de cada vez, sem quebrar nada.

**049** · 5:13 · **Téo** (skeptical, explain) · Lia reage: happy · tela: Lia e Téo conversando

> Com os testes rodando a cada passo, espero.

**050** · 5:16 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
