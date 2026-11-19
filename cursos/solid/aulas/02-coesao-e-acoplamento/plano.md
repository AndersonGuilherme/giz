# Plano: Aula 02 · Por que mover 3 linhas levou 2 dias

**Formato**: investigação com Lia e Téo. **Mistério**: tirar a regra de frete do checkout (para o carrinho, aula 01)
foi estimado em 5 minutos e levou 2 dias. Por quê?

**Objetivo**: medir a coesão de uma classe (tabela pedaços × dados) e o acoplamento de um trecho (o que ele precisa
saber para rodar sozinho), incluindo acoplamento temporal.

**Exemplo** (`exemplos/`, `node --test shipping.test.ts` → 4 testes): `order-service.before.ts` (checkout da aula 01),
`shipping.ts` (regra extraída: `shippingFor(método, subtotal)`), `cart-preview.ts` (carrinho sem pedido nem e-mail),
`order-service.after.ts` (checkout usando a regra — o bug da Black Friday da aula 01 desaparece).

**Participação**: "Ache a coluna" (a coluna `total` aparece em todas as linhas da tabela de coesão).
**Erro comum**: quebrar tudo em funçõezinhas — separar demais também derruba a coesão.
**Desafio**: montar a tabela do arquivo escolhido na aula 01 e listar o que uma função precisa saber.
