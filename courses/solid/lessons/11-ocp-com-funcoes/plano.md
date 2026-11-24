# Plano: Aula 11 · Aberto/fechado sem uma classe sequer

**Formato**: investigação com Lia e Téo. **Gancho** (provocação, não incidente): a loja escrita só com funções na
tela — "Sem classe, sem interface, sem herança. Isso ainda é aberto/fechado?". Fechado no cap. 7 ("nenhuma classe,
e era aberto e fechado o tempo todo").

**Objetivo**: aplicar OCP sem herança — regra como função, funções de ordem superior (fábricas), combinadores
(política como peça) e promoções configuradas por dados — e comparar com a versão de classes da aula 10.

**Regras de negócio explícitas**: as mesmas da aula 10 (VIP 10%, funcionário 30%, Black Friday 20%, cupom BEMVINDO
R$ 25, Dia das Mães 15% de 4 a 10/05, vale o maior, nunca passa do subtotal) + pedido novo do financeiro: **na
Black Friday, o cupom acumula** (o resto continua "vale o maior").

**Exemplo** (`examples/`, `node --test functions.test.ts` → 5 testes):
- `rules-fn.ts` — `type Rule = (ctx) => number`; fábricas `percentOff`/`fixedOff`; condições `isVip`, `couponIs`,
  `between`…;
- `combinators.ts` — `bestOf` (vale o maior), `sumOf` (acumula), `capped` (teto);
- `store.ts` → `store.combo.ts` — a política nova é trocar uma peça (`sumOf`), nenhuma regra editada;
- `promotions.json` + `from-config.ts` — a tabela vira regras pelas mesmas fábricas; `validate` barra erros;
- `load.ts` + `promotions-typo.json` — saída real na tela: `Dia das Mães: percent 150 fora de 1 a 100`.

**Pistas**: (1) o tipo de uma função já é contrato; (2) função que devolve função = fábrica de regras; (3) combinador
recebe regras e devolve regra → composição; a política deixa de estar presa num laço; (4) dados abrem para quem não
programa, mas exigem validação; (5) a tabela não aceita tipo novo ("leve 3, pague 2") — o ponto de extensão mudou
de lugar (o intérprete).

**Honestidade/contrapontos**: com classes também dá para compor (uma regra que soma outras); a versão com funções
perdeu o nome da promoção usado no e-mail — se importa, o contrato cresce de novo.
**Participação**: "Pense" (3 s) — "na versão com classes, onde você mexeria?".
**Frase-chave** (uma vez, cap. 7): "Aberto/fechado é sobre onde a mudança entra. Não sobre herança."
**Desafio**: reescrever uma regra como função, montar a política com `bestOf`/`sumOf`, achar uma mudança que a
própria tabela não aceita.
**Próxima**: 12 · Quando NÃO abrir (YAGNI) — "quanto custa um ponto de extensão que ninguém usou".
