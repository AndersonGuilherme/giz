# Plano: Aula 06 · Dois centavos que ninguém pediu

**Formato**: investigação com Lia e Téo. **Gancho** (número surpreendente): desde terça, o pedido VIP sai dois centavos
mais barato (o erro chega a 50 centavos por pedido) e o financeiro não pediu mudança nenhuma. **Mistério**: quem
mexeu no preço sem querer? Fechado: uma linha com dois donos (o desconto arredondado alimentava o total E o e-mail).

**Objetivo**: cortar uma classe pelos eixos de mudança (um ator = um eixo = uma classe) e reconhecer o bug típico
de código compartilhado entre atores, e a "duplicação acidental".

**Continuidade**: parte dos quatro atores da aula 05 e da pista "o número é do financeiro, a aparência é da
comunicação". Termina com o desenho-alvo do módulo; a aula 07 mostra como chegar lá sem quebrar nada.

**Exemplo** (`examples/`, `node --test *.test.ts` → 5 testes): `order-service.ts` (checkout com o helper
`roundMoney` em `money.ts`), `money.changed.ts` (o commit da comunicação: arredonda para real inteiro),
`order-service.changed.ts` (mesmo checkout, só o helper mudou), `rounding.demo.ts` (falha de propósito:
`18880 !== 18882`), `price-calculator.ts` (financeiro, arredonda ao centavo), `order-notifier.ts` (comunicação,
economia em reais redondos: "R$ 21"), `order-repository.ts` (jurídico), `order-service.split.ts` (só orquestra;
frete pelo SUBTOTAL, antes do desconto), `split.test.ts` (3 testes, saída real no terminal).

**Regras ditas**: arredondar o total é decisão do financeiro (vai para cobrança e nota fiscal); frete grátis sobre o
subtotal, antes do desconto. Números: subtotal R$ 209,80, VIP 10% → desconto R$ 20,98 → R$ 188,82.

**Participação**: "Ache a ligação" (4 s): como uma mudança no e-mail chegou ao preço?
**Erro comum**: unificar código parecido de atores diferentes em nome do "não se repita" (duplicação acidental).
**Teste do corte**: o próximo pedido de mudança deve mexer numa classe só; o `OrderService` muda só quando o fluxo muda.
**Frase-chave**: "Junte o que muda pelo mesmo motivo. Separe o que muda por motivos diferentes."
**Desafio**: achar um helper chamado de vários lugares, anotar o ator de cada chamada e perguntar se mudam juntos.
