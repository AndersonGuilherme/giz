# Roteiro: Aula 21 · Recebe pelo construtor, então segue o DIP?

> GERADO de `roteiro.ts` — edite lá e rode o build. 50 falas · 699 palavras · 24 cenas · duração 5:20 · uma cena nova a cada 13 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · A polêmica

**001** · 0:00 · **Téo** (excited, point) · Lia reage: skeptical · tela: código `quiz/b-recebe-concreto.ts`

> Essa classe recebe o repositório pelo construtor. Então ela segue a inversão de dependência, né?
>
> ⏸ 3s — "Sim ou não?"

**002** · 0:09 · **Lia** (skeptical, raise) · Téo reage: surprised · tela: (continua)

> Não. Ela tem injeção. Inversão, não tem.

**003** · 0:14 · **Téo** (confused, shrug) · Lia reage: happy · tela: (continua)

> Pera. Injeção não é a mesma coisa que inversão?

**004** · 0:18 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> São três ideias que andam juntas e quase todo mundo mistura. Hoje a gente separa uma da outra.

## 2 · Três palavras

**005** · 0:24 · **Lia** (happy, explain) · Téo reage: thinking · tela: cartão "Três palavras"

> [Inversão] é sobre direção: para onde apontam os imports. Foi a aula passada inteira.

**006** · 0:31 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> [Injeção] é sobre entrega: o objeto recebe a peça pronta, em vez de criar.

**007** · 0:36 · **Lia** (happy, point) · Téo reage: thinking · tela: (continua)

> E [contêiner] é uma ferramenta que faz essa entrega por você. Opcional.

**008** · 0:41 · **Téo** (happy, explain) · Lia reage: happy · tela: (continua)

> Uma é projeto, outra é técnica, outra é ferramenta. Saquei.

**009** · 0:46 · **Lia** (excited, point) · Téo reage: surprised · tela: código `domain/order-service.ts`

> E você usa injeção desde o módulo um. Olha [o now do checkout]: a data chega de fora, por parâmetro.
>
> _voz:_ E você usa injeção desde o módulo um. Olha [a data do chéquiaute]: ela chega de fora, por parâmetro.
>
> ⏸ 3s — "Leia o código"

**010** · 0:56 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> É por isso que dá pra testar a Black Friday numa terça-feira qualquer?

**011** · 1:00 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Exatamente. Construtor, parâmetro, função: tudo é injeção. O que importa é a peça não nascer lá dentro.

## 3 · Injeção sem inversão

**012** · 1:09 · **Lia** (skeptical, point) · Téo reage: surprised · tela: terminal

> Volta na classe B. A trilha: [o import ainda desce pra infra].

**013** · 1:15 · **Téo** (skeptical, raise) · Lia reage: happy · tela: (continua)

> Mas eu posso passar um repositório falso no construtor. Não posso?

**014** · 1:19 · **Lia** (happy, point) · Téo reage: surprised · tela: terminal

> Tenta. [O falso nem chega a ser usado].

**015** · 1:23 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> O import carregou o Postgres antes do meu falso existir!
>
> _voz:_ O import carregou o póstgres antes do meu falso existir!

**016** · 1:27 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> E o tipo do parâmetro é a classe do Postgres: o domínio ainda fala a língua do banco. A peça chega de fora, mas a seta não virou.
>
> _voz:_ E o tipo do parâmetro é a classe do póstgres: o domínio ainda fala a língua do banco. <pausa 0.2> A peça chega de fora, mas a seta não virou.

## 4 · Inversão sem injeção

**017** · 1:36 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> E o contrário existe? Inversão sem injeção?

**018** · 1:40 · **Lia** (happy, point) · Téo reage: thinking · tela: código `quiz/d-busca-porta.ts`

> Existe. Essa classe vai buscar a porta num registro do próprio domínio. Ninguém entrega nada pra ela.
>
> ⏸ 4s — "Leia o código"

**019** · 1:52 · **Lia** (happy, point) · Téo reage: surprised · tela: terminal

> A trilha: [só domínio]. A seta está certa.

**020** · 1:56 · **Téo** (excited, raise) · Lia reage: skeptical · tela: (continua)

> Então está tudo bem?

**021** · 1:58 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> Funciona, mas esconde. Olhando a classe por fora, você não sabe do que ela precisa. E se ninguém registrar a peça, só descobre rodando.

**022** · 2:07 · **Lia** (thinking, point) · Téo reage: thinking · tela: table

> Juntando tudo: [A] não recebe nem inverte. [B] recebe, mas não inverte. [D] inverte sem receber. E [C] faz as duas coisas.

**023** · 2:17 · **Téo** (excited, point) · Lia reage: happy · tela: (continua)

> Dois eixos independentes. Por isso dá pra ter um sem o outro.

## 5 · Raiz de composição

**024** · 2:22 · **Téo** (skeptical, raise) · Lia reage: happy · tela: Lia e Téo conversando

> Fico com a C. Mas aí, de novo: quem dá o new?
>
> _voz:_ Fico com a C. <pausa 0.2> Mas aí, de novo: quem dá o niú?

**025** · 2:27 · **Lia** (happy, point) · Téo reage: thinking · tela: código `main.ts`

> O arquivo da borda, da aula passada, agora com nome: [raiz de composição]. O único lugar que dá new na infra.
>
> _voz:_ O arquivo da borda, da aula passada, agora com nome: [raiz de composição]. <pausa 0.2> O único lugar que dá niú na infra.
>
> ⏸ 4s — "Leia o código"

**026** · 2:39 · **Téo** (happy, point) · Lia reage: happy · tela: (continua)

> E trocar o SMTP pelo provedor novo é mudar [uma linha aqui].
>
> _voz:_ E trocar o ésse eme tê pê pelo provedor novo é mudar [uma linha aqui].

**027** · 2:43 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> E no teste você monta a sua própria raiz, com peças de mentira. A mesma classe, outra montagem.

**028** · 2:50 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Então fora da raiz eu nunca mais posso dar new?
>
> _voz:_ Então fora da raiz eu nunca mais posso dar niú?

**029** · 2:53 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> Pode, no que é estável: uma data, uma lista, um valor do pedido. A regra vale pro volátil: banco, rede, e-mail, fornecedor.

**030** · 3:03 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Isso é injeção feita à mão, sem biblioteca nenhuma?

**031** · 3:06 · **Lia** (excited, point) · Téo reage: surprised · tela: terminal

> Nenhuma. E com bônus: errou o nome de uma peça? [O compilador avisa antes de rodar].

## 6 · O contêiner

**032** · 3:14 · **Téo** (skeptical, shrug) · Lia reage: happy · tela: Lia e Téo conversando

> E o contêiner? Todo framework grande tem um.
>
> _voz:_ E o contêiner? Todo frêimuork grande tem um.

**033** · 3:18 · **Lia** (happy, point) · Téo reage: thinking · tela: código `container.ts`

> No fundo, um contêiner é isso: um mapa de receitas por nome. Quando alguém pede uma peça, ele monta e guarda.
>
> ⏸ 6s — "Leia o código"

**034** · 3:32 · **Lia** (skeptical, point) · Téo reage: surprised · tela: código `main-container.ts`

> A mesma montagem, com ele. Repara: [as ligações viraram nomes escritos em texto].
>
> ⏸ 4s — "Leia o código"

**035** · 3:42 · **Téo** (concerned, raise) · Lia reage: concerned · tela: terminal

> E se eu errar o nome aqui? [Só descubro rodando].

**036** · 3:46 · **Lia** (thinking, explain) · Téo reage: thinking · tela: (continua)

> Num sistema deste tamanho, o contêiner trocou um erro de compilação por um erro na hora de rodar.

**037** · 3:52 · **Téo** (surprised, raise) · Lia reage: happy · tela: (continua)

> Então contêiner é ruim?

**038** · 3:54 · **Lia** (happy, explain) · Téo reage: thinking · tela: table

> É questão de tamanho. [Poucas classes]: à mão é mais claro. [Centenas de peças], ou [uma peça nova a cada requisição], como uma transação: aí ele se paga. E [se o framework já traz um], use o dele.

**039** · 4:09 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> E se eu registrar a classe B no contêiner? Aí vira inversão?

**040** · 4:13 · **Lia** (excited, point) · Téo reage: surprised · tela: (continua)

> Não vira. O contêiner não inverte nada. A seta continua descendo, só que montada automaticamente.

## 7 · A lição

**041** · 4:20 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Resumo"

> [Inversão]: a seta aponta pro domínio. [Injeção]: a peça chega de fora.

**042** · 4:27 · **Téo** (happy, point) · tela: (continua)

> [Contêiner]: ferramenta opcional. E [a raiz de composição] fica num lugar só, na borda.

**043** · 4:34 · **Téo** (thinking, think) · Lia reage: happy · tela: Lia e Téo conversando

> E a classe B, do começo? Segue a inversão?

**044** · 4:37 · **Lia** (thinking, explain) · Téo reage: surprised · tela: (continua)

> Não. O construtor diz como a peça chega. Quem diz a direção é o import. E o dela ainda aponta pro Postgres.
>
> _voz:_ Não. <pausa 0.2> O construtor diz como a peça chega. Quem diz a direção é o import. <pausa 0.2> E o dela ainda aponta pro póstgres.

**045** · 4:46 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> Inversão decide a direção. Injeção entrega a peça. Contêiner é só o entregador.

## 8 · Desafio

**046** · 4:53 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [acha uma classe] que recebe uma classe concreta da infra. [Tem injeção? Tem inversão?]

**047** · 5:01 · **Lia** (happy, explain) · tela: (continua)

> Depois [escreve a raiz de composição] do seu projeto num arquivo só. Conta quantos new aparecem.
>
> _voz:_ Depois [escreve a raiz de composição] do seu projeto num arquivo só. Conta quantos niú aparecem.

**048** · 5:07 · **Lia** (happy, point) · Téo reage: excited · tela: cartão "Próxima aula"

> Na próxima aula: dublês de teste. Cinco tipos, e quanto tempo a suíte economiza de verdade.

**049** · 5:15 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Testar o pedido sem subir banco. Tô dentro.

**050** · 5:18 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até a próxima!
