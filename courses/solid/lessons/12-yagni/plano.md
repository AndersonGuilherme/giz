# Plano: Aula 12 · O sistema de plugins que nunca recebeu um plugin

**Formato**: investigação com Lia e Téo. **Gancho** (número surpreendente, não incidente): "6 arquivos, 76 linhas,
interface de plugin, registro, carregador… e em dois anos, nenhum plugin novo" (cenário simulado, sinalizado na
tela; as 76 linhas são reais: `wc -l`). Fechado no cap. 7 ("eram um seguro contra uma mudança que nunca veio, e não
cobriram a que veio").

**Objetivo**: decidir onde vale um ponto de extensão (histórico de mudanças + regra de três) e reconhecer o custo
de um ponto de extensão especulativo (leitura, manutenção, eixo errado).

**Regras de negócio explícitas**: imposto estimado na nota = 5% do valor (alíquota **fictícia**); mudança que veio:
por estado de destino — SP 7%, RJ 8%, demais 5% (**fictícias**, escritas na tela e no código).

**Exemplo** (`examples/`, `node --test tax.test.ts` → 4 testes):
- `plugins/v1/` — 6 arquivos: `tax-plugin.ts` (contrato recebe só o item), `registry.ts` (duplicado, prioridade),
  `loader.ts`, `config.ts`, `default.ts` (5%), `tax-service.ts`;
- `tax.ts` — a mesma regra em 6 linhas;
- `plugins/v2/` — o estado de destino exigiu mudar contrato, registro, serviço e plugin (`diff -rq v1 v2`, saída real
  na tela: 4 arquivos);
- `tax.v2.ts` — na versão simples: uma tabela de estados e um parâmetro.

**Pistas**: (1) custo de ler (4 saltos até a multiplicação, `graph`); (2) custo de manter (prioridade entre plugins
com um plugin só, testada); (3) a mudança real veio por outro eixo (destino, não produto) e modificou o ponto de
extensão; (4) evidência: histórico de mudanças (tabela simulada: descontos 14×, frete 5×, e-mail 2×, imposto 1×) e
regra de três; os descontos das aulas 09–10 foram abertos na 4ª promoção.

**Contraponto**: vale pensar antes quando mudar depois é caro de verdade (interface pública usada por outros times,
formato de arquivo persistido). YAGNI completa o OCP: escolher contra qual mudança se fechar pelo que já aconteceu.
**Participação**: "Pense" (4 s) — "o contrato do plugin está pronto para essa mudança?".
**Frase-chave** (uma vez, cap. 7): "Abra o código onde a mudança já bateu, não onde você acha que ela vai bater."
**Desafio**: achar uma interface com uma implementação só, contar quantas vezes mudou no último ano, decidir se
mantém ou volta a ser função simples.
**Próxima**: 13 · Subtipo é contrato (LSP) — "uma classe filha sempre pode ocupar o lugar da mãe?".
