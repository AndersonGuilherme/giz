# Roteiro: Aula 12 · O sistema de plugins que nunca recebeu um plugin

> GERADO de `roteiro.ts` — edite lá e rode o build. 49 falas · 711 palavras · 20 cenas · duração 5:14 · uma cena nova a cada 16 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O número

**007** · 0:00 · **Téo** (surprised, raise) · Lia reage: skeptical · tela: cartão "Plugins de imposto · 2 anos (cenário simulado)"

> [Seis arquivos]. [Interface de plugin, registro, carregador]. E em dois anos, [nenhum plugin novo].

**008** · 0:07 · **Lia** (skeptical, think) · Téo reage: concerned · tela: (continua)

> E quanto essa preparação toda custou?

**009** · 0:10 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> É o que eu quero saber. Porque, na aula passada, eu saí querendo abrir tudo.

**010** · 0:15 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então hoje é o outro lado do princípio: quando um ponto de extensão sai mais caro do que ajuda.

## 2 · O suspeito

**011** · 0:21 · **Téo** (thinking, point) · Lia reage: thinking · tela: terminal

> [Setenta e seis linhas] de máquina de imposto.

**012** · 0:24 · **Lia** (thinking, point) · Téo reage: surprised · tela: código `plugins/v1/default.ts`

> E o único plugin que existe faz isto aqui: [cinco por cento sobre tudo].
>
> ⏸ 4s — "Leia o código"

**013** · 0:34 · **Téo** (surprised, shrug) · Lia reage: happy · tela: (continua)

> Uma multiplicação. Setenta e seis linhas pra uma multiplicação.

**014** · 0:39 · **Lia** (happy, point) · Téo reage: thinking · tela: código `tax.ts`

> Pra comparar, a versão sem plugin nenhum. Mesmo resultado, com teste provando.
>
> ⏸ 3s — "Leia o código"

## 3 · O custo

**015** · 0:47 · **Lia** (concerned, explain) · Téo reage: thinking · tela: graph

> Primeiro custo: ler. Quem quer saber o imposto sai do serviço, [passa pelo carregador, pela configuração, pelo registro], e só então acha a multiplicação.

**016** · 0:58 · **Téo** (concerned, think) · Lia reage: concerned · tela: (continua)

> Quatro saltos pra achar um número que cabe numa linha.

**017** · 1:01 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `plugins/v1/registry.ts`

> Segundo custo: manter. [Plugin duplicado], [prioridade entre plugins]... tudo isso tem código e teste.
>
> ⏸ 5s — "Leia o código"

**018** · 1:15 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Prioridade entre plugins, com um plugin só?

**019** · 1:18 · **Lia** (concerned, shrug) · Téo reage: thinking · tela: (continua)

> Pois é. Testando com cuidado um caso que nunca aconteceu. E todo mundo que entra no time precisa entender isso.

## 4 · A mudança que veio

**020** · 1:26 · **Lia** (thinking, explain) · Téo reage: thinking · tela: cartão "Pedido do financeiro"

> Até que um dia, depois de dois anos, o imposto mudou: passou a depender do estado pra onde vai o pedido.

**021** · 1:33 · **Téo** (excited, celebrate) · Lia reage: skeptical · tela: (continua)

> Finalmente! Chegou a hora do plugin brilhar.

**022** · 1:36 · **Lia** (skeptical, raise) · Téo reage: confused · tela: código `plugins/v1/tax-plugin.ts`

> Será? Olha o contrato do plugin. Ele está pronto pra essa mudança?
>
> ⏸ 4s — "Pense"

**023** · 1:46 · **Téo** (surprised, point) · Lia reage: happy · tela: (continua)

> [O plugin recebe o item]. Ninguém passa pra ele o estado de destino!

**024** · 1:51 · **Lia** (concerned, point) · Téo reage: concerned · tela: terminal

> Então, pra encaixar o estado, [mudaram o contrato, o registro, o serviço e o próprio plugin].

**025** · 1:57 · **Téo** (concerned, shrug) · Lia reage: thinking · tela: (continua)

> Quatro de seis arquivos. O ponto de extensão foi modificado pra receber a primeira extensão.

**026** · 2:03 · **Lia** (happy, point) · Téo reage: thinking · tela: código `tax.v2.ts` (novidades em verde vs `tax.ts`)

> E a versão simples? [Uma tabela de estados e um parâmetro novo].
>
> ⏸ 4s — "Leia o código"

**027** · 2:12 · **Lia** (thinking, explain) · Téo reage: surprised · tela: Lia e Téo conversando

> O plugin apostou que a mudança viria pelo produto. Ela veio pelo destino. Ponto de extensão por palpite costuma errar o eixo.

## 5 · Como decidir

**028** · 2:21 · **Téo** (confused, think) · Lia reage: happy · tela: (continua)

> Mas nas aulas nove e dez abrir foi ótimo. Como eu sei quando abrir?

**029** · 2:26 · **Lia** (happy, point) · Téo reage: thinking · tela: table

> Com evidência. Olha quantas vezes cada parte mudou no último ano: [descontos, catorze vezes], [frete, cinco], [e-mail, duas], [imposto, uma].

**030** · 2:36 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> [Descontos mudam sempre pelo mesmo motivo]: promoção nova. Ali o ponto de extensão se paga.

**031** · 2:43 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> E dá pra levantar isso de verdade: o histórico do controle de versão mostra quantas vezes cada arquivo mudou, e por quê.

**032** · 2:50 · **Lia** (happy, point) · Téo reage: thinking · tela: cartão "Regra de três"

> Quando não tem histórico, tem a regra de três. [Na primeira vez, escreve direto]. [Na segunda, repara na repetição e aguenta].

**033** · 2:59 · **Lia** (excited, point) · Téo reage: excited · tela: (continua)

> [Na terceira, você já sabe o formato da mudança]. Agora vale abrir.

**034** · 3:04 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Foi o que aconteceu com os descontos! VIP, funcionário, Black Friday... e o aniversário foi o quarto.
>
> _voz:_ Foi o que aconteceu com os descontos! Vípi, funcionário, bléqui fráidei... e o aniversário foi o quarto.

**035** · 3:12 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Exato. Quando a gente abriu, já tinha visto três promoções. O contrato nasceu de casos reais, não de palpite.

## 6 · Abrir depois

**036** · 3:20 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> Mas abrir depois não sai mais caro?

**037** · 3:23 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Se o código é simples e tem teste, não. A versão de seis linhas mudou em minutos.

**038** · 3:29 · **Lia** (concerned, explain) · Téo reage: concerned · tela: (continua)

> Já desfazer uma abstração errada é caro, porque o resto do sistema passou a depender dela.

**039** · 3:34 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Então uma abstração errada pode ser pior que nenhuma.

**040** · 3:38 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> Muitas vezes, é. E essa prudência tem nome: YAGNI. Do inglês: você não vai precisar disso.
>
> _voz:_ Muitas vezes, é. E essa prudência tem nome: iágni. <pausa 0.2> Do inglês: você não vai precisar disso.

**041** · 3:47 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> E YAGNI não briga com o aberto/fechado?
>
> _voz:_ E iágni não briga com o aberto e fechado?

**042** · 3:50 · **Lia** (happy, explain) · Téo reage: surprised · tela: (continua)

> Completa. Lembra da aula nove: você escolhe contra qual mudança se fechar. YAGNI diz pra escolher pelo que já aconteceu.
>
> _voz:_ Completa. Lembra da aula nove: você escolhe contra qual mudança se fechar. Iágni diz pra escolher pelo que já aconteceu.

**043** · 3:59 · **Téo** (thinking, think) · Lia reage: thinking · tela: (continua)

> E nunca vale abrir antes? Nem uma vez?

**044** · 4:03 · **Lia** (thinking, explain) · Téo reage: happy · tela: (continua)

> Vale quando mudar depois é caro de verdade. Uma interface pública que outros times já usam, um formato de arquivo gravado em milhões de pedidos.

**045** · 4:12 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> Ali, pensar antes é barato perto do conserto. Dentro do seu código, com teste, quase sempre dá pra esperar.

## 7 · A lição

**046** · 4:19 · **Lia** (happy, explain) · Téo reage: thinking · tela: versus

> De um lado, abrir por palpite: paga desde o primeiro dia e costuma errar. Do outro, abrir por evidência.

**047** · 4:27 · **Téo** (happy, raise) · Lia reage: happy · tela: (continua)

> Agora os seis arquivos fazem sentido: eram um seguro contra uma mudança que nunca veio. E não cobriram a que veio.

**048** · 4:35 · **Lia** (excited, point) · Téo reage: excited · tela: quote

> Abra o código onde a mudança já bateu, não onde você acha que ela vai bater.

## 8 · Desafio

**049** · 4:40 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [acha uma interface] no seu projeto que só tem uma implementação.

**050** · 4:46 · **Lia** (thinking, explain) · tela: (continua)

> [Conta quantas vezes ela mudou] no último ano. E [decide]: mantém, ou volta a ser uma função simples?

**051** · 4:53 · **Téo** (happy, celebrate) · Lia reage: happy · tela: cartão "Próximo módulo"

> Fechou o O. E agora?

**052** · 4:56 · **Lia** (thinking, raise) · Téo reage: thinking · tela: (continua)

> Agora uma pergunta que parece boba: se uma classe filha herda tudo da mãe, ela sempre pode ocupar o lugar dela?

**053** · 5:03 · **Téo** (skeptical, think) · Lia reage: happy · tela: (continua)

> Pela cara da Lia, a resposta é não.

**054** · 5:06 · **Lia** (happy, point) · Téo reage: excited · tela: (continua)

> No próximo módulo: o L do SOLID, com pagamentos que prometem mais do que cumprem.

**055** · 5:12 · **Téo** (excited, wave) · Lia reage: happy, wave · tela: Lia e Téo conversando

> Até lá!
