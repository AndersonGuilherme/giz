# Plano: Aula 17 · Nove métodos para usar um

**Formato**: episódio de investigação com Lia e Téo (ver `docs/guides/lesson-structure.md`).
**Gancho** (número surpreendente, não incidente): `node measure.ts` mostra que o dublê do teste do checkout
implementa 9 métodos e o checkout usa 1; o adaptador do cartão finge 2 métodos e o do Pix, 5.
**Mistério**: um teste e dois adaptadores que não se conhecem estão inchados do mesmo jeito. De onde vem isso?
**Revelação**: os comentários da própria interface (`// cartão`, `// entrou com o boleto`, `// entrou com o Pix`):
ela cresceu pelo lado de quem IMPLEMENTA, cada provedor acrescentando o seu cardápio; ninguém perguntou o que cada
cliente precisa.

**Objetivo**: o aluno consegue reconhecer uma interface gorda e medir os seus dois custos: para quem implementa
(métodos inúteis que lançam "não suportado", que viram violação de LSP) e para quem usa (dublês enormes e
dependência de métodos que não chama, que traz mudanças alheias).

**Frase-chave** (uma vez, no final): "Nenhum cliente deve ser forçado a depender de métodos que não usa."

**Regras de negócio explícitas** (ditas e escritas no código):
- Cartão autoriza na compra e captura no despacho (`on-shipped.ts`).
- Pix não tem autorização prévia: nasce pendente com o QR e vira pago quando o banco avisa; o nosso provedor de Pix
  não parcela, não tem contestação de cartão e não emite boleto.
- Valores em centavos.

**Exemplo concreto** (`examples/`, `node --test *.test.ts` → 6 testes passando):
- `payment-gateway.ts` — a interface gorda: 9 métodos, comentados por provedor de origem;
- `card-gateway.ts` / `pix-gateway.ts` — adaptadores em memória; cartão finge 2 métodos, Pix finge 5;
- `checkout.ts` — `payOrder` só chama `gateway.charge`;
- `fake-gateway.ts` — dublê do checkout: 19 linhas, 8 de 9 métodos só lançam "não usado no teste";
- `on-shipped.ts` — o despacho captura qualquer gateway; `on-shipped.v2.ts` é a solução tentadora (`instanceof PixGateway`);
- `lsp.demo.ts` — despachar pedido pago com Pix, falhando de propósito (`não suportado no Pix: capture`);
- `payment-gateway.v2.ts` + `fake-gateway.v2.ts` — entra `splitPayment` (marketplace); o MESMO dublê deixa de
  compilar (`tsc --noEmit --strict fake-gateway.v2.ts` → TS2420). Não compila de propósito; não é testado;
- `measure.ts` — mede os números do gancho lendo os arquivos (saída real na tela).

**Erro comum** (solução tentadora): 1) "é só lançar erro, ninguém vai chamar" → o despacho chama; 2) `instanceof`
no cliente → teste de tipo do módulo de LSP; 3) dublê com `as` → desliga o compilador onde ele protege.

**Participação do aluno**: pausa de 3 s "Conte os falsos" no adaptador do Pix.

**Desafio**: escolher uma interface com dublê nos testes, contar métodos do dublê × métodos que o cliente chama,
procurar "não suportado"/"not implemented" nas implementações.

**Não entra nesta aula**: como segregar (aula 18: interfaces do ponto de vista do cliente, quando não segregar demais).
