# Plano: Aula 21 · Recebe pelo construtor, então segue o DIP?

**Formato**: investigação com Lia e Téo. **Gancho** (afirmação polêmica): o Téo mostra uma classe que recebe
`PostgresOrderRepository` pelo construtor e afirma que ela segue a inversão de dependência ("Sim ou não?", 3 s).
A Lia discorda: tem injeção, não tem inversão.

**Objetivo**: separar três ideias: inversão (direção das setas: projeto), injeção (como a peça chega: técnica —
construtor, parâmetro, função) e container (ferramenta opcional que automatiza a injeção). Escrever uma raiz de
composição à mão e saber quando um container se paga.

**Frase-chave** (uma vez, no final): "Inversão decide a direção. Injeção entrega a peça. Contêiner é só o entregador."

**Exemplo** (`examples/`, `node --test *.test.ts` → 4 testes):
- `domain/` e `infra/` — o estado do fim da aula 20 (portas no domínio, infra implementando);
- `quiz/a-cria-sozinho.ts` (nem injeção nem inversão), `quiz/b-recebe-concreto.ts` (injeção sem inversão),
  `quiz/c-recebe-porta.ts` (as duas), `quiz/d-busca-porta.ts` + `domain/registry.ts` (inversão sem injeção);
- `deps.ts` — trilha real: B → `infra/postgres-order-repository.ts`; D → só domínio;
- `b-injecao.demo.ts` — passar um fake para B cai com `DATABASE_URL ausente`: o import carrega o Postgres antes;
- `quiz.test.ts` — C aceita um fake sem banco; D só funciona se alguém lembrar de registrar a peça;
- `main.ts` — raiz de composição à mão; `main-typo.demo.ts` — erro de digitação pego pelo `tsc` (TS2552);
- `container.ts` (container mínimo: receitas por nome) + `main-container.ts` — a mesma montagem;
- `container-typo.demo.ts` — o mesmo erro de digitação só aparece rodando (`nada registrado como "notfier"`);
- `composition.test.ts` — as duas montagens entregam o mesmo checkout funcionando.

**Pista extra**: o `now` do `checkout(order, customer, now)` já era injeção por parâmetro desde o módulo 1 (é o
que permite testar a Black Friday numa terça-feira).

**Pergunta difícil do Téo**: "fora da raiz nunca mais posso dar `new`?" Pode, no estável (data, lista, valor do
pedido); a regra vale para o volátil. E "registrar a B no container vira inversão?" Não: o container não inverte nada.

**Quando o container vale**: poucas dúzias de classes → à mão; centenas de peças, peça nova por requisição
(transação) ou framework que já traz um → container.

**Erro comum**: achar que injeção (ou container) implica inversão. O construtor diz como a peça chega; o import
diz a direção.

**Desafio**: achar uma classe que recebe uma classe concreta da infra, responder "tem injeção? tem inversão?" e
escrever a raiz de composição do projeto num arquivo só, contando os `new`.

**Não entra nesta aula**: tipos de dublê e tempo de teste (aula 22).
