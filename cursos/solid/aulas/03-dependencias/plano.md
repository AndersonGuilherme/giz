# Plano: Aula 03 · Por que trocar o e-mail quebrou o teste do frete

**Formato**: investigação com Lia e Téo. **Mistério**: o provedor de e-mail mudou e o teste do FRETE caiu.

**Objetivo**: desenhar o grafo de dependências de um módulo seguindo os imports, reconhecer dependência transitiva
e saber para que lado as setas devem apontar (do volátil para o estável).

**Exemplo** (`exemplos/`): `mail-provider.ts` exige `MAIL_API_KEY` ao carregar; `shipping-via-checkout.test.ts` cai
sem a chave (teste → checkout → infra → provedor); `shipping.test.ts` (função da aula 02) passa;
`deps.ts` imprime a trilha real de imports (3 dependências × 1).

**Erro comum**: achar que o ideal é não ter dependências — o objetivo é escolher a direção.
**Desafio**: desenhar as setas do arquivo escolhido, seguir a trilha até a infra, marcar volátil × estável.
