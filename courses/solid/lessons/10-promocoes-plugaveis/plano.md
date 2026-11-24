# Plano: Aula 10 · Dia das Mães sem editar uma linha do cálculo

**Formato**: investigação com Lia e Téo. **Gancho** (uma aposta, não incidente): "colocar o Dia das Mães no ar sem
editar uma linha do cálculo de preço, com teste provando". Fechado no cap. 7 ("Ganhou. Zero linhas no cálculo").

**Objetivo**: adicionar uma promoção nova (Dia das Mães) sem editar o cálculo, sabendo **o que fica na
calculadora** (a política comum) e **o que vira peça** (cada promoção).

**Regras de negócio explícitas** (ditas e escritas no código): VIP 10% · funcionário 30% · Black Friday 20% ·
cupom BEMVINDO R$ 25 (valor fixo) · Dia das Mães 15% para todos de 4 a 10/05/2026 (domingo, dia 10) · **não
acumula: vale o maior** · **desconto nunca passa do subtotal** · **empate fica com a primeira da lista**.

**Exemplo** (`exemplos/`, `node --test promotions.test.ts` → 6 testes):
- `discount-rule.ts` — contrato: `name` + `amount(ctx)` em centavos; `coupon?` opcional no contexto;
- `rules.ts` — VIP, funcionário, Black Friday e a fábrica `coupon(code, cents)`;
- `price-calculator.nocap.ts` → `price-calculator.ts` — o teto (`Math.min`) entra na parte estável;
- `cap.demo.ts` — falha de propósito: cupom de R$ 25 em pedido de R$ 20 (`2500 !== 2000`);
- `mothers-day.ts` — arquivo novo; `store.v1.ts` → `store.ts` — a única linha que muda é a da lista.

**Pistas**: (1) o cupom mostra que comparar taxas não serve — compara-se dinheiro; (2) mudar o contrato custa caro
(todas as regras adaptadas) — acerte-o cedo; (3) o teto vale para todas → é política, mora na calculadora
(corrigir bug não fere o princípio); (4) a promoção entra pela lista, no arquivo que monta a loja.

**Participação**: "Pense" (3 s) em "R$ 25 é mais que 10%?" e em "cupom de R$ 25 num pedido de R$ 20".
**Erro comum**: uma regra perguntar pelas outras ("Dia das Mães não vale com cupom") — as peças voltam a se
conhecer; a regra deve olhar só o contexto.
**Frase-chave** (uma vez, cap. 7): "A política fica no centro, e as promoções entram pela borda."
**Desafio**: escrever "Leve 3, pague 2" e descobrir se o contexto atual basta (não tem os itens) e o que muda no
contrato.
**Próxima**: 11 · OCP com composição e funções ("precisa mesmo de objeto?").
