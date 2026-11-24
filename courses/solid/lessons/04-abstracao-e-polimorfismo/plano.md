# Plano: Aula 04 · O switch que cobrou R$ 35 por um locker de R$ 9

**Formato**: investigação com Lia e Téo. **Mistério**: o locker (R$ 9) foi cobrado como expresso (R$ 35) e ninguém
mexeu no expresso.

**Objetivo**: trocar um `switch` que cresce por abstração + interface + polimorfismo, e saber quando NÃO fazer isso.

**Exemplo** (`examples/`, `node --test shipping.test.ts` → 3 testes): `shipping-switch.ts` (case sem `break`:
locker cai no expresso; `tsc --noFallthroughCasesInSwitch` acusa TS7029), `shipping.ts` (interface `ShippingMethod`
+ 5 métodos), `checkout.ts` (só chama `method.price`), `drone.ts` (método novo sem alterar nada),
`locker.demo.ts` (falha de propósito: `3500 !== 900`).

**Participação**: "Ache o bug" (5 s) no switch.
**Erro comum**: interface para todo `if` — dois casos estáveis ficam melhor com um `if`.
**Ponte**: "estender sem modificar" vira o O do SOLID.
**Desafio**: achar um switch que cresce, escrever a interface, listar o impacto de um caso novo.
