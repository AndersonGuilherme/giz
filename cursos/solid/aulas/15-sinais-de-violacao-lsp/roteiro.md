# Roteiro: Aula 15 · Sete linhas que denunciam uma herança quebrada

> GERADO de `roteiro.ts` — edite lá e rode o build. 50 falas · 748 palavras · 24 cenas · duração 5:36 · uma cena nova a cada 14 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A busca

**001** · 0:00 · **Téo** (excited, point) · Lia reage: skeptical · tela: terminal

> Uma busca de dez segundos no código de pagamentos. [Sete resultados]. E todos os testes passam.

**002** · 0:07 · **Lia** (skeptical, point) · Téo reage: concerned · tela: (continua)

> Sete linhas dizendo que essa herança não substitui. E ainda falta o pior sinal, aquele que busca nenhuma acha.

**003** · 0:14 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Metade dessas linhas fui eu, consertando as duas últimas aulas.

**004** · 0:19 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Normal. Cada um resolveu um problema real, com pressa. A pergunta é por que precisou de tantos.

**005** · 0:26 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então hoje é caça: os quatro sinais de que um subtipo não cumpre o contrato, no código de verdade.

## 2 · Perguntar o tipo

**006** · 0:33 · **Lia** (happy, point) · Téo reage: thinking · tela: symptoms

> Primeiro sinal: [perguntar o tipo].

**007** · 0:36 · **Téo** (happy, point) · Lia reage: skeptical · tela: código `loja/orders.ts`

> O envio. Boleto não tem captura, então eu pulo.
>
> ⏸ 4s — "Leia o código"

**008** · 0:44 · **Lia** (skeptical, point) · Téo reage: thinking · tela: código `loja/support.ts`

> E o atendimento já tem [um caminho pra cada tipo].
>
> ⏸ 4s — "Leia o código"

**009** · 0:51 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Se quem usa precisa saber qual subtipo chegou, o subtipo não está substituindo nada. E todo pagamento novo obriga a editar esses lugares.

**010** · 1:01 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Pera aí. Isso é o aberto-fechado quebrando de novo.

**011** · 1:05 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> É. Quebrar Liskov quase sempre empurra o problema pro O.
>
> _voz:_ É. Quebrar Líscov quase sempre empurra o problema pro Ó.

**012** · 1:10 · **Lia** (thinking, raise) · Téo reage: thinking, think · tela: código `loja/receipt.ts`

> E esse aqui não tem instanceof nenhum. Onde está a pergunta?
>
> _voz:_ E esse aqui não tem instance óf nenhum. <pausa 0.2> Onde está a pergunta?
>
> ⏸ 4s — "Ache o sinal"

**013** · 1:19 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> [No switch pelo nome da classe]. A mesma pergunta, disfarçada. Por isso a busca também procura nome de classe em texto.

## 3 · Não suportado

**014** · 1:27 · **Lia** (happy, point) · Téo reage: thinking · tela: symptoms

> Segundo sinal: [o método que lança "não suportado"].

**015** · 1:31 · **Téo** (happy, explain) · Lia reage: skeptical · tela: código `loja/methods.ts`

> Boleto não tem captura: quem confirma é o banco. Lançar erro é honesto, né?
>
> ⏸ 4s — "Leia o código"

**016** · 1:41 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> É honesto. Mas é a pré-condição mais forte que existe: não me chame. E quem escreve código novo só lê a base.

**017** · 1:50 · **Lia** (thinking, point) · Téo reage: thinking · tela: código `loja/jobs.ts`

> Como esse job novo: toda noite, captura o que saiu pra entrega.
>
> _voz:_ Como essa rotina nova: toda noite, captura o que saiu pra entrega.
>
> ⏸ 4s — "Leia o código"

**018** · 1:59 · **Téo** (surprised, shrug) · Lia reage: concerned · tela: terminal

> E [quebra no primeiro boleto].

**019** · 2:01 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: (continua)

> Mas cartão também pode ser recusado. Todo erro é sinal?

**020** · 2:06 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Não. A recusa está no contrato da base: qualquer cartão pode ser recusado, e quem chama se prepara. "Não suportado" é o subtipo recusando o próprio contrato.

**021** · 2:17 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E se a própria base avisasse que nem todo pagamento captura?

**022** · 2:21 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> Aí já é outro desenho, e é pra lá que a gente vai na aula dezesseis: quem não captura nem deveria ter o método.

## 4 · O vazio

**023** · 2:28 · **Lia** (concerned, point) · Téo reage: thinking · tela: symptoms

> Terceiro sinal, e o pior: [o override que não faz nada].

**024** · 2:33 · **Téo** (happy, point) · Lia reage: skeptical · tela: código `loja/methods.ts`

> Cartão-presente: o estorno é manual, então deixei vazio. Esse não quebra nada.
>
> ⏸ 4s — "Leia o código"

**025** · 2:43 · **Lia** (skeptical, point) · Téo reage: thinking · tela: código `loja/returns.ts`

> Não quebra. Agora olha a devolução de produto, outro código novo, escrito pra qualquer pagamento.
>
> ⏸ 4s — "Leia o código"

**026** · 2:54 · **Lia** (concerned, point) · Téo reage: surprised · tela: terminal

> [Zero]. O pedido fica como reembolsado, e o cliente não recebe nada.

**027** · 2:59 · **Téo** (concerned, think) · Lia reage: concerned · tela: (continua)

> E nenhum erro. Nenhum aviso.

**028** · 3:02 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Por isso é o pior. O "não suportado" explode no teste; o vazio só aparece quando o cliente reclama. E é esse que nenhuma busca acha. Devolver nulo onde a base devolve um valor é da mesma família.

**029** · 3:16 · **Téo** (thinking, raise) · Lia reage: happy · tela: (continua)

> O teste de contrato da aula passada pegaria esse?

**030** · 3:19 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> Na hora. A pós-condição diz que o valor estornado sobe. O vazio não sobe nada, e o teste fica vermelho.

## 5 · O comentário

**031** · 3:27 · **Lia** (happy, point) · Téo reage: thinking · tela: symptoms

> Quarto sinal: [o comentário que avisa].

**032** · 3:30 · **Téo** (confused, point) · Lia reage: skeptical · tela: código `loja/payment.ts`

> Mas eu documentei! Está escrito ali, em maiúsculas.
>
> ⏸ 6s — "Leia o código"

**033** · 3:41 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Está escrito pra gente. O compilador não lê, o teste de contrato não lê, e quem chama pela base nem abre esse arquivo. É uma pré-condição mais forte, só que em português.

**034** · 3:52 · **Téo** (happy, shrug) · Lia reage: happy · tela: (continua)

> Um contrato que só vale se alguém ler.

**035** · 3:54 · **Lia** (thinking, shrug) · Téo reage: thinking · tela: (continua)

> Comentário de aviso costuma nascer depois de um incidente. Alguém se queimou e deixou um bilhete pro próximo.

## 6 · Falso alarme

**036** · 4:01 · **Téo** (skeptical, raise) · Lia reage: thinking · tela: Lia e Téo conversando

> Então todo instanceof é proibido?
>
> _voz:_ Então todo instance óf é proibido?

**037** · 4:04 · **Lia** (thinking, explain) · Téo reage: thinking · tela: versus

> Não. Na borda é normal: separar tipos de erro, ou validar um dado que chegou de fora. O sinal é usar o tipo pra escolher o comportamento de uma hierarquia que é sua.

**038** · 4:16 · **Téo** (happy, think) · Lia reage: happy · tela: (continua)

> Tipo tratar cartão recusado diferente de queda de rede.

**039** · 4:20 · **Lia** (happy, point) · Téo reage: happy · tela: (continua)

> Isso. Ali o tipo é a própria informação, não um remendo.

**040** · 4:24 · **Téo** (thinking, raise) · Lia reage: thinking · tela: (continua)

> E um override que chama a base e só acrescenta um log?

**041** · 4:28 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> Tudo bem. Faz tudo o que a base fazia e mais um pouco. Entrega mais, nunca menos, como na aula passada.

## 7 · A lição

**042** · 4:35 · **Lia** (thinking, explain) · Téo reage: thinking · tela: symptoms

> Quatro sinais, uma causa só: o subtipo não cumpre o contrato da base, e alguém de fora fica compensando.

**043** · 4:43 · **Lia** (happy, point) · Téo reage: thinking · tela: table

> E dá pra ligar cada um à aula passada. [O "não suportado"] e [o comentário] são pré-condições mais fortes. [O vazio] é pós-condição mais fraca. E [o instanceof] é o remendo do lado de fora.
>
> _voz:_ E dá pra ligar cada um à aula passada. [O "não suportado"] e [o comentário] são pré-condições mais fortes. [O vazio] é pós-condição mais fraca. E [o instance óf] é o remendo do lado de fora.

**044** · 4:55 · **Téo** (concerned, think) · Lia reage: happy · tela: (continua)

> E todo conserto meu foi no lugar errado: em quem usa, não no subtipo.

**045** · 5:01 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> As sete linhas da busca não eram sete problemas. Era um só, vazando em sete lugares. Quando quem usa precisa saber qual subtipo chegou, o subtipo já não substitui.
>
> _voz:_ As sete linhas da busca não eram sete problemas. <pausa 0.2> Era um só, vazando em sete lugares. <pausa 0.4> Quando quem usa precisa saber qual subtipo chegou, <pausa 0.2> o subtipo já não substitui.

## 8 · Desafio

**046** · 5:13 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [roda essa busca no seu projeto]. Instanceof e switch por tipo.
>
> _voz:_ Desafio: [roda essa busca no seu projeto]. Instance óf e suítch por tipo.

**047** · 5:19 · **Lia** (happy, explain) · tela: (continua)

> Depois ["não suportado" e "não chame"]. E o difícil: [procurar os métodos vazios] na mão.

**048** · 5:25 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima, a gente conserta de verdade: a hierarquia inteira, com o teste de contrato passando pra todo mundo.

**049** · 5:33 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> E eu apago os meus ifs.

**050** · 5:35 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
