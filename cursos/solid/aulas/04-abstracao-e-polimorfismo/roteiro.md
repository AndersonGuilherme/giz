# Roteiro: Aula 04 · O switch que cobrou R$ 35 por um locker de R$ 9

> GERADO de `roteiro.ts` — edite lá e rode o build. 35 falas · 433 palavras · 16 cenas · duração 3:31 · uma cena nova a cada 13 s em média
> `[trecho]` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.

## 1 · O bug

**001** · 0:00 · **Téo** (concerned, explain) · Lia reage: thinking · tela: terminal

> O cliente escolheu retirar no locker, nove reais. [Pagou trinta e cinco].

**002** · 0:05 · **Lia** (surprised) · Téo reage: concerned · tela: (continua)

> Trinta e cinco? Esse é o preço do expresso.

**003** · 0:09 · **Téo** (confused, shrug) · Lia reage: thinking · tela: (continua)

> E eu só adicionei o locker. Não encostei no expresso.

**004** · 0:13 · **Lia** (happy, explain) · Téo reage: excited · tela: title

> Então hoje a gente aprende a parar de mexer no mesmo lugar toda vez que aparece uma opção nova.

## 2 · O monstro

**005** · 0:19 · **Lia** (skeptical, point) · Téo reage: thinking · tela: código `shipping-switch.ts`

> Olha a função de frete depois de alguns meses de transportadora nova.
>
> ⏸ 7s — "Leia o código"

**006** · 0:30 · **Téo** (excited, raise) · Lia reage: happy · tela: (continua)

> Antes da Lia explicar: por que o locker cobrou trinta e cinco?
>
> _voz:_ Antes da Lia explicar: <pausa 0.2> por que o locker cobrou trinta e cinco?
>
> ⏸ 5s — "Ache o bug"

**007** · 0:40 · **Lia** (happy, point) · Téo reage: surprised · tela: (continua)

> [Faltou um break]. O locker calcula nove reais e [cai direto no caso do expresso], que troca pra trinta e cinco.

**008** · 0:48 · **Téo** (concerned, shrug) · Lia reage: happy · tela: (continua)

> Um break. Dois dias de cliente reclamando por causa de um break.

**009** · 0:53 · **Lia** (thinking, point) · Téo reage: surprised · tela: terminal

> Dá pra pedir pro TypeScript avisar: [essa opção pega exatamente isso].

**010** · 0:58 · **Lia** (concerned, explain) · Téo reage: thinking · tela: (continua)

> Mas o problema de fundo continua: toda forma nova de entrega mexe nessa mesma função. Rigidez e fragilidade de novo.

## 3 · Abstração

**011** · 1:07 · **Lia** (happy, explain) · Téo reage: thinking · tela: cartão "Três ideias"

> Três ideias resolvem isso. A primeira é [abstração]: separar o que importa de como é feito.

**012** · 1:14 · **Téo** (thinking, think) · Lia reage: happy · tela: (continua)

> Tipo: o checkout precisa saber o preço do frete, mas não como cada transportadora calcula?

**013** · 1:20 · **Lia** (excited, point) · Téo reage: happy · tela: (continua)

> Exatamente. Pro checkout, frete é só um preço. [O resto é detalhe de cada um].

## 4 · Interface

**014** · 1:27 · **Lia** (happy, point) · Téo reage: thinking · tela: código `shipping.ts`

> A segunda é [interface]: o contrato. Todo método de entrega tem um nome e sabe dizer o seu preço.
>
> ⏸ 7s — "Leia o código"

**015** · 1:42 · **Téo** (skeptical) · Lia reage: happy · tela: (continua)

> É só um tipo com uma função dentro?

**016** · 1:44 · **Lia** (happy, explain) · Téo reage: thinking · tela: (continua)

> É. E é pequeno de propósito: quanto menor o contrato, mais fácil de cumprir.

## 5 · Polimorfismo

**017** · 1:51 · **Lia** (excited, point) · Téo reage: thinking · tela: (continua)

> A terceira é polimorfismo. Cada método cumpre o contrato do seu jeito: [retirada], [padrão], [locker], [entrega no mesmo dia].

**018** · 2:00 · **Téo** (happy, point) · Lia reage: happy · tela: código `checkout.ts`

> E quem usa chama sempre a mesma coisa: method.price.
>
> _voz:_ E quem usa chama sempre a mesma coisa: o preço do método.
>
> ⏸ 4s — "Leia o código"

**019** · 2:08 · **Lia** (excited, explain) · Téo reage: excited · tela: (continua)

> E quem decide o comportamento é o objeto que chegou, não um switch. Sem break pra esquecer.

## 6 · Peça nova

**020** · 2:14 · **Téo** (excited, raise) · Lia reage: happy · tela: código `drone.ts`

> Agora o produto quer entrega por drone.
>
> ⏸ 4s — "Leia o código"

**021** · 2:21 · **Lia** (happy, point) · Téo reage: excited · tela: (continua)

> Um arquivo novo. Nenhuma linha do checkout nem dos outros métodos mudou.

**022** · 2:27 · **Téo** (excited, celebrate) · Lia reage: happy · tela: terminal

> E [os testes passam]!

**023** · 2:29 · **Lia** (happy, explain) · Téo reage: happy · tela: (continua)

> E o locker nunca mais cai no caso do vizinho.

## 7 · Quando não usar

**024** · 2:32 · **Téo** (excited, raise) · Lia reage: skeptical · tela: Lia e Téo conversando

> Então todo if vira uma interface?

**025** · 2:35 · **Lia** (thinking, explain) · Téo reage: thinking · tela: versus

> Não. Se são dois casos que nunca mudam, um if é mais simples e mais claro. A interface vale quando as opções crescem, ou quando cada uma muda por um motivo diferente.

**026** · 2:46 · **Téo** (happy, think) · Lia reage: happy · tela: (continua)

> Tipo transportadora: todo mês aparece uma nova.

**027** · 2:50 · **Lia** (excited, point) · Téo reage: happy · tela: quote

> Isso. E guarda essa ideia: estender sem modificar. Ela vira um princípio inteiro, o O do SOLID.

## 8 · Desafio

**028** · 2:58 · **Lia** (happy, point) · Téo reage: happy · tela: cartão "Resumo"

> [Abstração]: o que importa, sem o como.

**029** · 3:02 · **Téo** (happy, point) · tela: (continua)

> [Interface]: um contrato pequeno.

**030** · 3:05 · **Lia** (excited, point) · tela: (continua)

> [Polimorfismo]: a mesma chamada, cada um do seu jeito.

**031** · 3:09 · **Téo** (excited, point) · Lia reage: happy · tela: cartão "Desafio"

> Desafio: [acha um switch] no seu projeto que cresce todo mês.

**032** · 3:14 · **Lia** (happy, explain) · tela: (continua)

> [Escreve a interface] que cada caso cumpriria. E [lista o que mudaria] se surgisse um caso novo.

**033** · 3:20 · **Lia** (excited, point) · Téo reage: excited · tela: cartão "Próximo módulo"

> Fim do módulo de fundamentos. No próximo: o S do SOLID, responsabilidade única.

**034** · 3:27 · **Téo** (excited, celebrate) · Lia reage: happy · tela: Lia e Téo conversando

> Agora sim: SOLID de verdade.

**035** · 3:30 · **Lia** (excited, wave) · Téo reage: excited, wave · tela: (continua)

> Até lá!
