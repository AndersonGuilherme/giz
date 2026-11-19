# Roteiro: Aula 08 · Sete classes, uma regra perdida

> GERADO de `roteiro.ts` — edite lá e rode o build. 51 falas · 704 palavras · 21 cenas · duração 5:17 · uma cena nova a cada 15 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O desafio

**001** · 0:00 · **Téo** (excited, raise) · Lia reage: thinking · tela: table

> Desafio rápido: duas versões do mesmo cálculo de preço, [com o mesmo resultado]. A tem uma classe, B tem sete. Qual é a mais SOLID?
>
> _voz:_ Desafio rápido: <pausa 0.2> duas versões do mesmo cálculo de preço, [com o mesmo resultado]. A tem uma classe, B tem sete. Qual é a mais sólid?
>
> ⏸ 4s — "A ou B?"

**002** · 0:13 · **Lia** (skeptical, think) · Téo reage: happy · tela: (continua)

> Guarda a sua resposta. Um pedido do financeiro vai decidir.

**003** · 0:18 · **Téo** (happy, point) · Lia reage: skeptical · tela: (continua)

> Eu já votei: B. Fui eu que escrevi.

**004** · 0:22 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então hoje é o outro lado do princípio: quando separar demais vira problema.

## 2 · A defesa

**005** · 0:28 · **Téo** (excited, point) · Lia reage: thinking · tela: código `fragmentado/price-calculator.ts`

> Olha que limpo: [subtotal], [cada desconto na sua classe], [soma das taxas], [aplica]. Cada classe faz uma coisa só!
>
> ⏸ 4s — "Leia o código"

**006** · 0:39 · **Lia** (skeptical, point) · Téo reage: surprised · tela: terminal

> E quantos arquivos você abre pra entender o preço? [Sete].

**007** · 0:44 · **Téo** (skeptical, shrug) · Lia reage: thinking · tela: (continua)

> Arquivo pequeno é fácil de ler, ué.

**008** · 0:47 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Cada um, sim. O preço inteiro, não: você pula de arquivo em arquivo e monta a regra na cabeça.

**009** · 0:54 · **Lia** (skeptical, raise) · Téo reage: surprised · tela: (continua)

> E "faz uma coisa só"... lembra da aula cinco?

**010** · 0:58 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> Era a régua errada. A certa é quem pede a mudança.

## 3 · O dono

**011** · 1:02 · **Lia** (happy, point) · Téo reage: thinking · tela: table

> Então pergunta pra cada classe da versão B: [quem pede pra você mudar]?

**012** · 1:07 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> Financeiro, financeiro... [As sete respondem ao mesmo ator]!

**013** · 1:12 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Um ator, sete classes. O princípio não pediu esse corte. Pelo princípio, o que um ator pede deveria morar junto.

**014** · 1:20 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Tá, mas separar demais faz mal? Só fica mais arquivo.

**015** · 1:25 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> Faz. Quer ver? Vamos simular um pedido do financeiro.

## 4 · O pedido

**016** · 1:29 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "E se o financeiro pedir…"

> E se o financeiro pedir: [Black Friday de trinta e cinco por cento]? E [a regra de sempre continua]: não acumula, vale o maior.

**017** · 1:39 · **Téo** (excited, point) · Lia reage: skeptical · tela: código `pedido-bf35/black-friday-discount.ts` (novidades em verde vs `fragmentado/black-friday-discount.ts`)

> Fácil! Na versão B é [um número num arquivo]. Responsabilidade única funcionando.
>
> ⏸ 5s — "Leia o código"

**018** · 1:50 · **Lia** (neutral, point) · Téo reage: happy · tela: código `pedido-bf35/price-calculator-a.ts` (novidades em verde vs `price-calculator.ts`)

> Na versão A também é uma linha só.
>
> ⏸ 3s — "Leia o código"

**019** · 1:56 · **Lia** (thinking, point) · Téo reage: thinking · tela: terminal

> Agora o teste: funcionário na Black Friday tem que levar o maior, trinta e cinco. [A passou. B, não].

**020** · 2:04 · **Téo** (surprised, shrug) · Lia reage: concerned · tela: (continua)

> Trinta por cento? Mas eu mudei a Black Friday certinho!

**021** · 2:09 · **Téo** (thinking, raise) · Lia reage: happy · tela: código `pedido-bf35/black-friday-discount.ts`

> Antes da Lia: por que o funcionário ficou com trinta?
>
> ⏸ 4s — "Ache o bug"

## 5 · A regra sumida

**022** · 2:17 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> [Nesse comentário]: funcionário fica de fora, porque já tem mais. Com vinte por cento, era verdade. Com trinta e cinco, não é mais.

**023** · 2:27 · **Téo** (concerned, point) · Lia reage: thinking · tela: (continua)

> A regra do maior desconto estava escondida numa exceção.

**024** · 2:30 · **Téo** (confused, raise) · Lia reage: skeptical · tela: (continua)

> Mas cada classe da B tinha o seu teste. Todos verdes!

**025** · 2:35 · **Lia** (thinking, point) · Téo reage: surprised · tela: terminal

> E continuam verdes, [mesmo depois da mudança]. Cada peça está certa sozinha.

**026** · 2:41 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> O erro mora entre as peças, num lugar que nenhum teste unitário olha. Quanto mais peças, mais esconderijos.

**027** · 2:48 · **Lia** (skeptical, point) · Téo reage: surprised · tela: código `fragmentado/vip-discount.ts`

> E [tem outra aqui], no VIP. A regra "vale o maior" não está escrita em lugar nenhum: virou exceções espalhadas, mais uma soma que só funciona por causa delas.
>
> ⏸ 4s — "Leia o código"

**028** · 3:02 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> Então, pra mudar um número, eu precisava conhecer três arquivos.

**029** · 3:07 · **Lia** (happy, point) · Téo reage: happy · tela: código `price-calculator.ts`

> Na versão A, a regra mora numa linha: [se a taxa for menor, vale a da Black Friday]. Quem muda o número enxerga a regra inteira.
>
> ⏸ 4s — "Leia o código"

**030** · 3:20 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Separar demais derrubou a coesão. O que mudava junto foi parar longe.

**031** · 3:25 · **Lia** (concerned, explain) · Téo reage: surprised · tela: (continua)

> E nem diminuiu o acoplamento. As classes continuam dependendo umas das outras. Só que agora em segredo, por comentário.

## 6 · O tamanho certo

**032** · 3:33 · **Téo** (skeptical, raise) · Lia reage: happy · tela: Lia e Téo conversando

> Tá, me convenceu. Mas então qual é o tamanho certo de uma classe?

**033** · 3:38 · **Lia** (happy, explain) · Téo reage: thinking · tela: cartão "Como decidir o tamanho"

> Não se mede em linhas. [Um ator por classe, e o ator inteiro nela].

**034** · 3:43 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> [Uma regra de negócio, um lugar]: dá pra ler a regra sem abrir três arquivos.

**035** · 3:49 · **Lia** (skeptical, point) · Téo reage: thinking · tela: (continua)

> [Classes que sempre mudam juntas] são uma classe só, morando em dois endereços.

**036** · 3:54 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E quando a classe cresce demais, mesmo com um ator só?

**037** · 3:57 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Primeiro, funções privadas com bons nomes. Classe nova, só quando aparecer outra razão pra mudar.

**038** · 4:04 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> [E o sinal pra separar vem do histórico]. Se o marketing começar a criar promoção toda semana, promoção vira um eixo próprio.

**039** · 4:12 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> E aí as classes de desconto voltam?

**040** · 4:14 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Voltam, mas de outro jeito: com a regra do maior desconto escrita num lugar só. Esse é o próximo módulo.

## 7 · A lição

**041** · 4:22 · **Lia** (happy, point) · Téo reage: concerned · tela: table

> Então, a resposta do desafio: [a versão A é a mais SOLID]. Um ator, e a regra inteira num lugar só.
>
> _voz:_ Então, a resposta do desafio: <pausa 0.2> [a versão A é a mais sólid]. Um ator, e a regra inteira num lugar só.

**042** · 4:30 · **Téo** (happy, shrug) · Lia reage: happy · tela: (continua)

> Perdi o meu voto. Mas ganhei um teste vermelho bem educativo.

**043** · 4:34 · **Lia** (happy, explain) · Téo reage: happy · tela: cartão "SRP na medida"

> [Classe pequena não é sinônimo] de responsabilidade única.

**044** · 4:38 · **Téo** (happy, point) · tela: (continua)

> [Fragmentar espalha a regra] e derruba a coesão.

**045** · 4:42 · **Lia** (skeptical, point) · tela: (continua)

> E o corte [é por ator, não por linha].

**046** · 4:44 · **Lia** (happy, explain) · Téo reage: happy · tela: quote

> Responsabilidade única não é responsabilidade mínima.

## 8 · Desafio

**047** · 4:48 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [acha um grupo de classes pequenas] que sempre mudam juntas no seu projeto.

**048** · 4:54 · **Lia** (happy, explain) · tela: (continua)

> [Confere se respondem ao mesmo ator]. Se sim, [junta], e conta quantos arquivos o próximo pedido toca.

**049** · 5:01 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próximo módulo"

> Fim do módulo da responsabilidade única. No próximo: o O do SOLID, e o que "fechado para modificação" quer dizer de verdade.
>
> _voz:_ Fim do módulo da responsabilidade única. No próximo: <pausa 0.2> o Ó do sólid, e o que "fechado para modificação" quer dizer de verdade.

**050** · 5:10 · **Téo** (confused, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> Fechado? Como é que eu mudo um código fechado?

**051** · 5:14 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Essa é a graça. Até lá!
