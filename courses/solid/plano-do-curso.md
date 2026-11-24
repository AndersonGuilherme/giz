# Plano do curso: SOLID de verdade

## Resultado final
O aluno olha um código real, aponta qual princípio está sendo violado, explica o custo concreto disso
e refatora com segurança (com testes), sabendo também **quando não aplicar** o princípio.

## Projeto-fio
Um sistema de **pedidos de uma loja online** (pedido, cálculo de frete, desconto, pagamento, nota, e-mail).
Começa como uma única classe enorme na aula 1 e termina, na aula 24, como um design limpo. Cada aula
mexe em um pedaço dele, então o aluno vê a evolução em vez de exemplos soltos (sem "Animal/Cachorro").

## Módulos e aulas (24 aulas · ~3h20 no total)

| # | Aula | O aluno consegue… | Min |
|---|---|---|---|
| **0 · Fundamentos** ||||
| 01 | Como uma linha de código causou um desastre | apontar os 4 sinais de código apodrecendo e o custo de cada um | 5 |
| 02 | Por que mover 3 linhas levou 2 dias (coesão e acoplamento) | medir coesão (tabela) e acoplamento, incluindo o temporal | 4 |
| 03 | Por que trocar o e-mail quebrou o teste do frete (dependências) | desenhar o grafo de imports, reconhecer transitiva, apontar para o estável | 3 |
| 04 | O switch que cobrou R$ 35 por um locker de R$ 9 (abstração e polimorfismo) | trocar um switch que cresce por interface + polimorfismo, e saber quando não | 4 |
| **1 · S — Responsabilidade Única** ||||
| 05 | SRP: "uma razão para mudar" é um **ator** | identificar os atores que pedem mudanças numa classe | 8 |
| 06 | Encontrando os eixos de mudança | separar o `Order` por ator (financeiro, logística, comunicação) | 9 |
| 07 | Refatoração SRP passo a passo (com testes) | extrair classes sem quebrar comportamento | 10 |
| 08 | SRP exagerado | reconhecer fragmentação excessiva e coesão perdida | 6 |
| **2 · O — Aberto/Fechado** ||||
| 09 | O que "fechado para modificação" quer dizer | explicar ponto de extensão vs editar código estável | 7 |
| 10 | Promoções plugáveis | adicionar uma promoção nova (ex.: Dia das Mães) sem editar o cálculo de preço | 6 |
| 11 | OCP com composição e funções | aplicar OCP sem herança | 8 |
| 12 | Quando NÃO abrir (YAGNI) | decidir onde vale um ponto de extensão | 6 |
| **3 · L — Substituição de Liskov** ||||
| 13 | Subtipo é contrato, não "é um" | explicar por que Quadrado/Retângulo quebra | 8 |
| 14 | Pré-condições, pós-condições e invariantes | checar se uma subclasse respeita o contrato | 9 |
| 15 | Sinais de violação no código real | achar `instanceof`, `NotImplemented`, override que ignora | 8 |
| 16 | Corrigindo a hierarquia de pagamentos | refatorar para respeitar LSP | 9 |
| **4 · I — Segregação de Interfaces** ||||
| 17 | Interfaces gordas e o custo para quem implementa | apontar dependência de métodos que não usa | 7 |
| 18 | Interface pelo ponto de vista do cliente | segregar `PaymentGateway` por uso | 8 |
| **5 · D — Inversão de Dependência** ||||
| 19 | Alto nível × baixo nível | dizer quem deve depender de quem | 8 |
| 20 | Invertendo a seta | fazer o domínio definir a interface que a infra implementa | 9 |
| 21 | DIP ≠ injeção de dependência ≠ container | diferenciar os três | 8 |
| 22 | Testando com dublês graças ao DIP | testar o pedido sem banco e sem e-mail | 9 |
| **6 · Tudo junto** ||||
| 23 | Refatorando o sistema de pedidos inteiro | aplicar os 5 princípios em sequência, com testes | 10 |
| 24 | Quando quebrar as regras | pesar SOLID contra simplicidade e prazo | 7 |

## Decisões
- Exemplos: **TypeScript** · Estilo: **2D** · Voz: **sintética local (Kokoro)** — 2026-11-19.
- Professores: **Lia** (mentora) e **Téo** (desenvolvedor curioso) — 2026-11-19. Guia: `personagens/guia-editorial.md`.
