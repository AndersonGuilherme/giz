# Plano: Aula 01 · Como uma linha de código causou um desastre

**Formato**: episódio de investigação com Lia e Téo (ver `padrao/estrutura-da-aula.md`).
**Mistério**: como uma simples consulta de frete disparou três mil e-mails de "Pedido confirmado"?
(cenário simulado — sinalizado na tela)

**Objetivo**: ao final, o aluno consegue **apontar numa classe os quatro sinais de código apodrecendo
(rigidez, fragilidade, imobilidade e viscosidade) e explicar o custo concreto de cada um**.

**Frase-chave** (uma vez, no final): "Código não apodrece porque envelhece. Apodrece quando cada mudança fica mais cara."

**Regra de negócio explícita** (dita na aula e escrita no código): frete grátis para **subtotal** a partir de
R$ 200, calculado **antes** de qualquer desconto. Sem ela, cobrar frete sobre R$ 168 poderia estar correto.

**Exemplo concreto** (`exemplos/`, `node --test order-service.test.ts` → 7 testes):
- `order-service.v1.ts` — original: frete calculado antes do desconto, como manda a regra;
- `order-service.v2.ts` — pedido 1, frete expresso (2 linhas, tranquilo);
- `order-service.v3.ts` — pedido 2, Black Friday: 4 pontos de mudança (**rigidez**); para mostrar a economia, o
  desconto foi para antes do frete e a linha do frete, **idêntica**, passou a ler o total com desconto
  (**fragilidade**: R$ 210 → R$ 168, perde o frete grátis);
- `cart-preview.ts` — o carrinho chama o checkout só para saber o frete e grava pedido + manda e-mail (**imobilidade**);
- `order-service.v4.ts` — o atalho `dryRun` (**viscosidade**);
- `fragility.demo.ts` — a regra verificada contra a v3, falhando de propósito (`2000 !== 0`, mostrado na tela).

**Erro comum**: "reescrever do zero". Com as mesmas decisões, recria os mesmos problemas.

**Causas** (apresentadas como comuns, não únicas): responsabilidades misturadas, dependências apontando para o
lugar errado e regras implícitas ("que ninguém escreveu").

**Participação do aluno**: pausa de 3 s com contagem "Ache o bug" antes da revelação da fragilidade.

**Desafio**: abrir o arquivo que ninguém gosta de mexer, procurar os quatro sinais; achou mais de um, "temos um caso".

**Não entra nesta aula**: como corrigir (SRP/OCP/DIP vêm depois); definição formal de coesão e acoplamento (aula 02).
