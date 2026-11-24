# Plano: Aula 20 · Gravar no banco sem importar o banco

**Formato**: investigação com Lia e Téo. **Gancho** (paradoxo): "O checkout precisa gravar no Postgres sem importar
o Postgres. Será que dá?" (pausa de 3 s). A Lia responde que, no fim, quem importa alguém é o Postgres.

**Objetivo**: inverter uma dependência em três movimentos (o domínio escreve as portas, o serviço recebe as
portas, a infra implementa as portas), provar a virada com a trilha real de imports e enunciar o DIP completo,
incluindo "a abstração não depende de detalhe". Distinguir fluxo de execução (serviço → banco) de dependência de
código (banco → porta).

**Frase-chave** (uma vez, no final): "A política define a porta. O detalhe se encaixa nela."

**Exemplo** (`examples/`, `node --test *.test.ts` → 2 testes; rodar `deps.ts` de dentro de `antes/` ou `depois/`):
- `antes/` — o estado da aula 19 (`domain/order-service.ts` → 6 dependências, 4 de infra);
- `depois/domain/ports.ts` — `OrderRepository.save(order)` e `Notifier.orderConfirmed(...)`, na língua do domínio;
- `depois/domain/order-service.ts` — recebe as portas no construtor (diff contra `antes/`) → 3 dependências, todas do domínio;
- `depois/infra/postgres-order-repository.ts` e `smtp-notifier.ts` — `implements` a porta; importam `../domain/ports.ts`;
- `depois/infra/api-notifier.ts` — a decisão da aula 19 (provedor via API): arquivo novo, domínio intacto;
- `depois/main.ts` — a borda que dá os `new` (vira "raiz de composição" na aula 21);
- `checkout.test.ts` — o checkout testado com objetos literais que cumprem as portas, sem banco nem chave;
- `architecture.ts` + `architecture.test.ts` — teste de arquitetura: nenhum `domain/` importa `../infra/`;
- `architecture.demo.ts` — a mesma regra contra `antes/` e `tentacao/`, falhando de propósito (mostrado na tela);
- `tentacao/` — a versão do Téo: interface `IPostgresOrderRepository` morando na infra e falando de linhas de tabela.

**Participação do aluno**: "Pense" (3 s) no paradoxo; "Ache o problema" (4 s) na versão do Téo.

**Erro comum**: criar a interface do lado da infra, com a língua do banco (`insertOrderRow`, `rows`). Tem
interface e injeção, mas a seta continua descendo e a abstração depende do detalhe.

**Pergunta difícil do Téo**: "toda classe precisa de interface?" Não: porta só na fronteira com o volátil
(banco, rede, e-mail, relógio, fornecedor).

**Mistério fechado**: o checkout grava no Postgres em tempo de execução, mas no código a seta vem do banco até a porta.

**Desafio**: escolher um import política → infra do serviço da aula 19, escrever a porta na pasta do domínio,
fazer a infra implementar e comparar a trilha de imports antes e depois.

**Não entra nesta aula**: o nome "raiz de composição", injeção × container (aula 21); tipos de dublê (aula 22).
