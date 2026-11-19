# Roteiro: Aula 17 · Nove métodos para usar um

> GERADO de `roteiro.ts` — edite lá e rode o build. 48 falas · 727 palavras · 22 cenas · duração 5:26 · uma cena nova a cada 15 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O número

**001** · 0:00 · **Téo** (surprised, raise) · Lia reage: skeptical · tela: terminal

> [Nove métodos] no dublê do teste... [e o checkout usa um].
>
> _voz:_ [Nove métodos] no dublê do teste... <pausa 0.25> [e o chéquiaute usa um].

**002** · 0:04 · **Lia** (surprised) · Téo reage: concerned · tela: (continua)

> Um só? E os outros oito?

**003** · 0:07 · **Téo** (concerned, point) · Lia reage: thinking · tela: (continua)

> Só lançam erro. E nos adaptadores é igual: [o do cartão finge dois métodos]. [O do Pix, cinco].

**004** · 0:15 · **Lia** (skeptical, think) · Téo reage: confused · tela: Lia e Téo conversando

> Um teste e dois adaptadores que nem se conhecem, inchados do mesmo jeito. Isso não é coincidência.

**005** · 0:22 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Então de onde vem esse inchaço?

**006** · 0:24 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> De um lugar só. E ele está à vista desde o começo.

## 2 · O suspeito

**007** · 0:29 · **Lia** (skeptical, point) · Téo reage: thinking · tela: código `payment-gateway.ts`

> O suspeito: a interface de pagamento. Todo provedor implementa ela, e todo mundo que cobra depende dela.
>
> ⏸ 5s — "Leia o código"

**008** · 0:42 · **Téo** (happy, explain) · Lia reage: skeptical · tela: (continua)

> E qual o problema? Tá tudo num lugar só. [Cobrar], [capturar], [estornar], [parcelar]... qualquer provedor pluga aqui.

**009** · 0:50 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Parece organizado, né? Um lugar só, um tipo só. Agora olha quem precisa implementar isso.

## 3 · Quem implementa

**010** · 0:57 · **Téo** (neutral, point) · Lia reage: thinking · tela: código `pix-gateway.ts`

> O adaptador do Pix. Quantos métodos aqui só fingem que existem?
>
> _voz:_ O adaptador do Pix. <pausa 0.3> Quantos métodos aqui só fingem que existem?
>
> ⏸ 7s — "Conte os falsos"

**011** · 1:09 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> [Cinco]. Pix não tem autorização prévia: não captura nem cancela. E o nosso provedor de Pix não parcela, não tem contestação de cartão nem emite boleto.

**012** · 1:21 · **Téo** (surprised, point) · Lia reage: happy · tela: código `card-gateway.ts`

> E o do cartão, que veio primeiro, também finge: boleto e Pix.
>
> ⏸ 2s — "Leia o código"

**013** · 1:27 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Ninguém escapa. Cada adaptador paga pelos métodos dos outros.

**014** · 1:32 · **Téo** (skeptical, shrug) · Lia reage: skeptical · tela: (continua)

> Mas é uma linha cada. Lança erro e pronto. Ninguém vai chamar mesmo.

**015** · 1:38 · **Lia** (skeptical, raise) · Téo reage: confused · tela: (continua)

> Ninguém vai chamar? O tipo diz que todo provedor captura. E tem código que acredita nele.
>
> _voz:_ Ninguém vai chamar? <pausa 0.3> O tipo diz que todo provedor captura. E tem código que acredita nele.

## 4 · Liskov de brinde

**016** · 1:46 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `on-shipped.ts`

> O despacho. Quando o pedido sai do estoque, a loja [captura o valor] que foi autorizado na compra.
>
> ⏸ 4s — "Leia o código"

**017** · 1:56 · **Téo** (neutral, explain) · Lia reage: happy · tela: (continua)

> Fluxo de cartão: autoriza na compra, captura no despacho. E ele recebe qualquer provedor.

**018** · 2:03 · **Téo** (surprised, raise) · Lia reage: concerned · tela: terminal

> Aí sai do estoque [um pedido pago com Pix]...

**019** · 2:06 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> O compilador aceitou, e a execução quebrou. Você já viu isso no módulo de Liskov: um subtipo que não cumpre o que o tipo promete.

**020** · 2:15 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `on-shipped.v2.ts` (novidades em verde vs `on-shipped.ts`)

> Resolvo em uma linha: [se for Pix, pula a captura].
>
> ⏸ 3s — "Leia o código"

**021** · 2:22 · **Lia** (skeptical, point) · Téo reage: confused · tela: (continua)

> E agora o despacho conhece cada provedor pelo nome. É o teste de tipo que a gente aprendeu a caçar.

**022** · 2:29 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> Então a interface gorda me deu uma violação de Liskov de brinde.

**023** · 2:33 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Esse é o primeiro custo. Quem implementa é obrigado a prometer o que não sabe fazer.

## 5 · Quem usa

**024** · 2:39 · **Téo** (neutral, point) · Lia reage: thinking · tela: código `checkout.ts`

> Agora o outro lado. O checkout [só chama o cobrar].
>
> _voz:_ Agora o outro lado. O chéquiaute [só chama o cobrar].
>
> ⏸ 4s — "Leia o código"

**025** · 2:47 · **Lia** (skeptical, point) · Téo reage: surprised · tela: código `fake-gateway.ts`

> E pra testar essa linha, o dublê tem que ser um provedor inteiro. [Oito métodos] que o teste nunca chama.
>
> ⏸ 5s — "Leia o código"

**026** · 2:59 · **Téo** (happy, shrug) · Lia reage: skeptical · tela: (continua)

> Com uma biblioteca de dublês, isso vira uma linha por método. Fica bem menor.

**027** · 3:05 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Fica menor de escrever. Mas o checkout continua dependendo dos nove. E quem lê o teste não sabe quais importam.

**028** · 3:13 · **Téo** (excited, raise) · Lia reage: skeptical · tela: (continua)

> E se o dublê tiver só o cobrar, e eu forçar o tipo? Um "as" resolve.
>
> _voz:_ E se o dublê tiver só o cobrar, <pausa 0.2> e eu forçar o tipo?

**029** · 3:18 · **Lia** (skeptical, explain) · Téo reage: surprised · tela: (continua)

> Aí você desliga o compilador justo onde ele te protege. Se o checkout passar a chamar outro método, o teste quebra na execução, não na compilação.
>
> _voz:_ Aí você desliga o compilador justo onde ele te protege. Se o chéquiaute passar a chamar outro método, o teste quebra na execução, não na compilação.

**030** · 3:27 · **Téo** (skeptical, think) · Lia reage: happy · tela: (continua)

> Depender de um método que eu nem chamo custa o quê, na prática?

## 6 · A mudança alheia

**031** · 3:31 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "Marketplace"

> Pedido do time de vendedores parceiros: [dividir o pagamento entre vendedores]. [Entra mais um método na interface]. E [o checkout não muda nada].

**032** · 3:42 · **Lia** (skeptical, point) · Téo reage: surprised · tela: terminal

> Nada mesmo? Então compila [o dublê do checkout], sem mexer numa vírgula.

**033** · 3:47 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Eu não toquei no checkout... e o teste dele parou de compilar?
>
> _voz:_ Eu não toquei no chéquiaute... <pausa 0.25> e o teste dele parou de compilar?

**034** · 3:52 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> É esse o custo. Quem depende de um método que não usa recebe todas as mudanças dele. E o Pix ganha o sexto "não suportado".

**035** · 4:01 · **Téo** (thinking, point) · Lia reage: happy · tela: código `payment-gateway.ts`

> Pera aí. [Cartão], [boleto], [Pix]... cada provedor novo deixou os seus métodos aqui dentro.
>
> _voz:_ Pera aí. <pausa 0.2> [Cartão], [boleto], [Pix]... cada provedor novo deixou os seus métodos aqui dentro.
>
> ⏸ 2s — "Leia o código"

**036** · 4:10 · **Lia** (happy, point) · Téo reage: surprised · tela: graph

> Achou. A interface cresceu pelo lado de quem implementa. [Ninguém perguntou o que cada cliente precisa].

**037** · 4:17 · **Téo** (excited, explain) · Lia reage: happy · tela: (continua)

> Agora os nove métodos fazem sentido. É o cardápio de três provedores, servido pra todo mundo que cobra.

## 7 · A lição

**038** · 4:25 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Interface gorda"

> [Quem implementa promete o que não faz]. E isso vira violação de Liskov.

**039** · 4:30 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> [Quem usa depende do que não chama]. E carrega um dublê enorme.

**040** · 4:35 · **Lia** (concerned, point) · Téo reage: thinking · tela: (continua)

> E [a mudança de um cliente chega em todos], até em quem não tem nada a ver com ela.

**041** · 4:40 · **Téo** (excited, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Então o certo é uma interface por método?

**042** · 4:43 · **Lia** (thinking, explain) · Téo reage: confused · tela: (continua)

> Não necessariamente. Cortar por método é o exagero do outro lado. O corte certo vem de quem usa, e isso é a próxima aula.

**043** · 4:52 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> É a letra I do SOLID, a segregação de interfaces. Nenhum cliente deve ser forçado a depender de métodos que não usa.
>
> _voz:_ É a letra í do SOLID, <pausa 0.2> a segregação de interfaces. <pausa 0.4> Nenhum cliente deve ser forçado a depender de métodos que não usa.

## 8 · Desafio

**044** · 5:01 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [escolhe uma interface] do seu projeto que tem dublê nos testes.

**045** · 5:06 · **Lia** (happy, explain) · tela: (continua)

> [Conta os métodos do dublê e os que o cliente chama de verdade]. E [procura "não suportado" nas implementações].

**046** · 5:13 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: a interface do ponto de vista de quem usa. Cada cliente com o seu pedaço.

**047** · 5:20 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Quero ver esse dublê de dezenove linhas encolher.

**048** · 5:24 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
