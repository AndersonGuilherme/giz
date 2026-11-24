# Plano: Aula 18 · Quem usa decide o tamanho

**Formato**: episódio de investigação com Lia e Téo (ver `padrao/estrutura-da-aula.md`). Fecha o módulo 4 (ISP).
**Gancho** (escolha, não incidente): "uma interface com nove métodos ou nove interfaces com um método cada?"
com pausa de 3 s "Escolha". Lia: nenhuma das duas.
**Mistério**: se contar métodos não diz onde cortar, o que diz? Fechado no capítulo 6 ("depende de quem usa: nem
nove, nem um; aqui deu cinco papéis de um ou dois métodos").

**Objetivo**: o aluno consegue segregar uma interface gorda a partir dos clientes (tabela cliente × métodos
chamados), nomear cada interface pelo papel, reconhecer que uma classe pode cumprir vários papéis e saber quando
NÃO separar (mesmo cliente usa junto, mudam juntos, um cliente e uma implementação só).

**Frase-chave** (uma vez, no final): "Quem define a interface é quem usa, não quem implementa."

**Regras de negócio explícitas** (ditas e escritas no código):
- Despacho: item em estoque → captura; faltou → cancela a autorização (o cliente não paga) — `on-shipped.ts`.
- Atendimento confere o status e estorna; cartão só estorna o que foi capturado.
- Parcelado: de 2 a 12 vezes. Pix nasce pendente com o QR (gerado pelo próprio adaptador) e vira pago no webhook.
- Valores em centavos.

**Exemplo concreto** (`exemplos/`, `node --test *.test.ts` → 9 testes passando):
- `roles.ts` — `Charges` (checkout), `Captures` (despacho), `Refunds` (atendimento), `Installments` (parcelado),
  `Disputes` (financeiro); `issueBoleto`/`createPixQrCode` saem da interface (detalhe de implementação);
- `checkout.ts` (diff contra `checkout.v1.ts`, a versão da aula 17) — pede só `Charges`;
- `card-gateway.ts` — uma classe, cinco papéis, zero "não suportado"; `pix-gateway.ts` — só `Charges, Refunds`,
  QR privado; `ledger.ts` — registro em memória compartilhado pelos adaptadores;
- `fake-charges.ts` — dublê do checkout: 12 linhas, 1 método (era 19 linhas, 9 métodos);
- `measure.ts` — mesmos números da aula 17, agora depois da segregação (saída real na tela);
- `roles.v2.ts` + `fake-charges.v2.ts` — `splitPayment` vira o papel `Splits`; o mesmo dublê compila
  (`tsc --noEmit --strict fake-charges.v2.ts && echo ok`);
- `ship-pix.check.ts` — despachar pedido Pix: NÃO compila de propósito (`tsc -p .` → TS2345, Pix não é `Captures`);
  o `tsconfig.json` desta pasta só existe para essa verificação;
- `on-shipped.overkill.ts` — segregação demais: `Capture` e `Cancel` separados, chamada `onShipped(card, card, …)`.

**Erro comum**: 1) juntar pelo provedor ("o Pix implementa cobrar e estornar, então uma interface só") — volta a
cortar pelo lado de quem implementa; 2) uma interface por método — o mesmo objeto passado duas vezes.

**Participação do aluno**: pausa de 3 s "Escolha" no gancho.

**Desafio**: pegar a interface medida no desafio da aula 17, montar a tabela cliente × métodos, agrupar por papel e
medir o dublê de novo.

**Próxima aula** (19, DIP): Téo pergunta "se a interface pertence a quem usa, ela mora do lado do checkout?" —
alto nível × baixo nível, quem deve depender de quem.
