# Roteiro: Aula 18 · Quem usa decide o tamanho

> GERADO de `roteiro.ts` — edite lá e rode o build. 49 falas · 706 palavras · 26 cenas · duração 5:19 · uma cena nova a cada 12 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A escolha

**001** · 0:00 · **Téo** (excited, raise) · Lia reage: thinking · tela: cartão "Qual você escolhe?"

> Escolhe aí: [uma interface com nove métodos]... ou [nove interfaces com um método cada]?
>
> _voz:_ Escolhe aí: [uma interface com nove métodos]... <pausa 0.3> ou [nove interfaces com um método cada]?
>
> ⏸ 3s — "Escolha"

**002** · 0:09 · **Lia** (happy, shrug) · Téo reage: surprised · tela: (continua)

> Nenhuma das duas.

**003** · 0:11 · **Téo** (confused, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Como assim, nenhuma? Uma é gorda, a outra é magra.

**004** · 0:15 · **Lia** (thinking, explain) · Téo reage: skeptical · tela: (continua)

> É que a pergunta está errada. Contar métodos não diz onde cortar.

**005** · 0:20 · **Téo** (skeptical, think) · Lia reage: happy · tela: (continua)

> Então o que diz onde cortar?

**006** · 0:23 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Quem usa. E até o fim da aula você vai ter a resposta daquela escolha.

## 2 · Quem chama o quê

**007** · 0:28 · **Lia** (neutral, explain) · Téo reage: thinking · tela: Lia e Téo conversando

> Na aula passada, a interface de pagamento cresceu pelo lado dos provedores. Hoje a gente faz o caminho contrário: pergunta pra cada cliente o que ele chama.

**008** · 0:38 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> [O checkout] cobra. [O despacho] captura se o item está em estoque, ou cancela a autorização se faltou. [O atendimento] confere o status e estorna.
>
> _voz:_ [O chéquiaute] cobra. [O despacho] captura se o item está em estoque, ou cancela a autorização se faltou. [O atendimento] confere o status e estorna.

**009** · 0:48 · **Téo** (neutral, point) · Lia reage: happy · tela: (continua)

> [O parcelado] parcela, de duas a doze vezes. E [o financeiro] responde contestação de cartão.

**010** · 0:55 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Isso dá sete. E gerar boleto e gerar QR do Pix? Ninguém chama?

**011** · 1:00 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Ninguém de fora. Quem gera o QR é o próprio adaptador do Pix, na hora de cobrar. Era detalhe de implementação morando na interface.

## 3 · Um papel por cliente

**012** · 1:10 · **Lia** (happy, point) · Téo reage: thinking · tela: código `roles.ts`

> Então cada linha da tabela vira uma interface, com o nome do papel: [cobranças], [capturas], [estornos], [parcelas], [contestações].
>
> ⏸ 6s — "Leia o código"

**013** · 1:24 · **Téo** (excited, point) · Lia reage: happy · tela: código `checkout.ts` (novidades em verde vs `checkout.v1.ts`)

> E o checkout [pede só cobranças].
>
> _voz:_ E o chéquiaute [pede só cobranças].
>
> ⏸ 3s — "Leia o código"

**014** · 1:30 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Ele declara o que precisa, e só. Lendo a assinatura, você já sabe tudo o que ele faz com o pagamento.

**015** · 1:37 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> E o adaptador do cartão? Vai ser quebrado em cinco classes?

**016** · 1:41 · **Lia** (happy, point) · Téo reage: surprised · tela: código `card-gateway.ts`

> Não. Uma classe pode [cumprir vários papéis]. A classe continua do tamanho que precisa. O que encolhe é o que cada cliente enxerga.
>
> ⏸ 7s — "Leia o código"

## 4 · Dublê pequeno

**017** · 1:58 · **Téo** (excited, point) · Lia reage: happy · tela: código `fake-charges.ts`

> E o dublê do checkout... cabe numa olhada.
>
> _voz:_ E o dublê do chéquiaute... cabe numa olhada.
>
> ⏸ 4s — "Leia o código"

**018** · 2:06 · **Lia** (happy, point) · Téo reage: excited · tela: terminal

> Mede de novo: [um método, doze linhas], nenhum erro de enfeite. E [zero "não suportado"] nos adaptadores.

**019** · 2:14 · **Téo** (happy, celebrate) · Lia reage: happy · tela: (continua)

> Era nove métodos, oito só pra fazer volume.

**020** · 2:17 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> E quem abre o teste agora entende o checkout em dez segundos. O dublê virou documentação do que ele usa.
>
> _voz:_ E quem abre o teste agora entende o chéquiaute em dez segundos. O dublê virou documentação do que ele usa.

**021** · 2:24 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: cartão "Marketplace"

> E aquele pedido de dividir o pagamento entre vendedores? Na aula passada, ele quebrou o teste do checkout.
>
> _voz:_ E aquele pedido de dividir o pagamento entre vendedores? Na aula passada, ele quebrou o teste do chéquiaute.

**022** · 2:31 · **Lia** (happy, point) · Téo reage: surprised · tela: terminal

> Agora ele vira um papel novo, só de quem divide. E [o mesmo dublê compila] sem mexer em nada.

**023** · 2:38 · **Téo** (excited, explain) · Lia reage: happy · tela: (continua)

> O teste do checkout nem ficou sabendo que o marketplace existe.
>
> _voz:_ O teste do chéquiaute nem ficou sabendo que existe vendedor parceiro.

## 5 · Pix sem mentira

**024** · 2:42 · **Lia** (happy, point) · Téo reage: thinking · tela: código `pix-gateway.ts`

> E o Pix agora assina [só cobranças e estornos]. O QR virou um método privado dele.
>
> ⏸ 5s — "Leia o código"

**025** · 2:53 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> E se alguém tentar despachar um pedido Pix, como na aula passada?

**026** · 2:58 · **Lia** (neutral, point) · Téo reage: thinking · tela: código `on-shipped.ts`

> O despacho [pede capturas]. E o Pix não cumpre esse papel.
>
> ⏸ 4s — "Leia o código"

**027** · 3:06 · **Téo** (surprised, point) · Lia reage: happy · tela: terminal

> Então tentar despachar o Pix... [nem compila]!
>
> _voz:_ Então tentar despachar o Pix... <pausa 0.25> [nem compila]!

**028** · 3:10 · **Lia** (excited, explain) · Téo reage: surprised · tela: (continua)

> O erro saiu da execução e foi pro compilador. Quem monta o despacho só consegue entregar a ele quem sabe capturar.

**029** · 3:18 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> E sem nenhum teste de tipo no meio do despacho.

**030** · 3:21 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Pois é. Quando ninguém é obrigado a prometer o que não faz, sobra pouca promessa pra quebrar.

## 6 · Demais também dói

**031** · 3:28 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> E por que não juntar cobranças e estornos numa interface do Pix? Ele implementa os dois.

**032** · 3:34 · **Lia** (skeptical, explain) · Téo reage: surprised · tela: (continua)

> Aí você volta a cortar pelo lado de quem implementa. E o checkout ia depender de estorno sem nunca estornar.
>
> _voz:_ Aí você volta a cortar pelo lado de quem implementa. E o chéquiaute ia depender de estorno sem nunca estornar.

**033** · 3:41 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Tá, juntar pelo provedor não. E separar tudo, método por método?

**034** · 3:46 · **Téo** (excited, raise) · Lia reage: skeptical · tela: código `on-shipped.overkill.ts`

> Tipo assim: [uma interface pra capturar], [outra pra cancelar]. Bem fininhas.
>
> ⏸ 4s — "Leia o código"

**035** · 3:56 · **Lia** (skeptical, point) · Téo reage: confused · tela: (continua)

> E olha quem monta o despacho: [o mesmo objeto, duas vezes]. O despacho sempre usa os dois juntos.

**036** · 4:04 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Se é sempre o mesmo, separar não comprou nada. Só mais um parâmetro.

**037** · 4:09 · **Lia** (thinking, explain) · Téo reage: thinking · tela: cartão "Quando NÃO separar"

> Não separa [o que o mesmo cliente usa junto], nem [o que sempre muda junto]. E [com um cliente só e uma implementação só], talvez nem precise de interface.

**038** · 4:18 · **Téo** (happy, point) · Lia reage: excited · tela: Lia e Téo conversando

> Então a resposta da escolha do começo é: depende de quem usa. Nem nove, nem um.

**039** · 4:25 · **Lia** (excited, point) · Téo reage: happy · tela: (continua)

> Isso. Aqui deu cinco papéis, de um ou dois métodos. Em outro sistema, dá outro número.

## 7 · A lição

**040** · 4:32 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Interface do cliente"

> [Pergunta a cada cliente o que ele chama].

**041** · 4:35 · **Téo** (happy, point) · tela: (continua)

> [Uma interface por papel], com o nome do papel.

**042** · 4:38 · **Lia** (excited, point) · tela: (continua)

> E [uma classe pode cumprir vários papéis].

**043** · 4:41 · **Lia** (thinking, explain) · Téo reage: thinking · tela: versus

> A diferença é de ponto de vista. Uma lista o que o provedor sabe fazer. A outra, o que o cliente precisa.

**044** · 4:48 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> Porque quem define a interface é quem usa, não quem implementa.
>
> _voz:_ Porque quem define a interface <pausa 0.2> é quem usa, <pausa 0.3> não quem implementa.

## 8 · Desafio

**045** · 4:54 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [pega aquela interface] que você mediu na aula passada.

**046** · 4:59 · **Lia** (happy, explain) · tela: (continua)

> [Monta a tabela de quem chama o quê]. Depois [agrupa por papel] e mede o dublê de novo.

**047** · 5:05 · **Téo** (thinking, think) · Lia reage: excited · tela: Lia e Téo conversando

> Pera... se a interface pertence a quem usa, ela mora do lado do checkout?
>
> _voz:_ Pera... <pausa 0.2> se a interface pertence a quem usa, ela mora do lado do chéquiaute?

**048** · 5:10 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Essa é exatamente a próxima aula: alto nível e baixo nível. Quem deve depender de quem.

**049** · 5:18 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: Lia e Téo conversando

> Até a próxima!
