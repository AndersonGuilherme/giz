# Plano: Aula 19 · Trocar o banco deveria mexer no desconto?

**Formato**: investigação com Lia e Téo. **Gancho** (decisão de produto / "e se…"): o time vai trocar de banco e
de provedor de e-mail. Isso deveria mexer na regra de desconto? (pausa de 3 s para o aluno pensar)

**Objetivo**: distinguir política (alto nível) de detalhe (baixo nível) com o "teste do papel", ler a direção
das setas de import e explicar por que uma política que importa detalhes passa a mudar por dois motivos
(negócio e tecnologia). Enunciar a 1ª metade do DIP; a 2ª metade (abstrações) fica para a aula 20.

**Retoma a aula 03**: lá o teste do frete caiu por causa do provedor de e-mail e a Lia prometeu "virar a seta" na
aula de inversão de dependência. Esta aula mostra o mesmo problema no `OrderService` fino do módulo SRP.

**Frase-chave** (uma vez, no final): "Regra de negócio não deveria saber em que banco ela mora."

**Regras de negócio explícitas** (no código, em `domain/`): VIP 10% · funcionário 30% · Black Friday 20%,
não acumulam (vale o maior); frete grátis sobre o SUBTOTAL a partir de R$ 200, antes de descontos.

**Exemplo** (`examples/`, `node --test *.test.ts` → 4 testes):
- `domain/order-service.ts` — o serviço fino que importa e dá `new` em `PostgresOrderRepository` e `SmtpNotifier`;
- `infra/pg-pool.ts` (exige `DATABASE_URL` ao carregar) e `infra/mail-provider.ts` (exige `MAIL_API_KEY`, da aula 03);
- `deps.ts` — o script da aula 03, agora aceitando pastas: `domain/order-service.ts` → 6 dependências, 4 de infra;
- `rules.test.ts` — as regras sozinhas passam sem banco nem chave (3 testes);
- `checkout.test.ts` — o mesmo desconto pelo checkout, que só passa com `test-env.ts` configurando a infra;
- `checkout.demo.ts` — sem infra configurada, cai com `DATABASE_URL ausente` (mostrado na tela);
- `domain/order-service.factory.ts` + `infra/factory.ts` — a tentação: esconder o `new` numa fábrica → 7 dependências.

**Participação do aluno**: "Pense" (3 s) no gancho; "Siga o import" (3 s) antes de revelar que a fábrica não resolve.

**Erro comum**: achar que esconder o `new` (fábrica, função `create…`) inverte a dependência. Só alonga a seta.
Antecipa o segundo erro (interface morando na infra), resolvido na aula 20.

**Mistério fechado**: trocar de banco não muda a linha do desconto, mas muda o arquivo que orquestra o pedido e
todo teste que passa por ele.

**Desafio**: pegar um serviço do próprio projeto, aplicar o teste do papel em cada import e contar as setas que
descem da política para o detalhe.

**Não entra nesta aula**: como inverter (portas no domínio, aula 20); injeção e container (aula 21); dublês (aula 22).
