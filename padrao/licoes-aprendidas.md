# Lições aprendidas (atualizado a cada aula)

Toda aula nova começa lendo este arquivo. Cada item veio de um problema real, medido ou apontado na revisão humana.

## Ritmo e didática
1. **Código precisa de tempo de leitura** (revisão, aula 01). O motor já cria a pausa "Leia o código" sozinho quando
   uma cena de código nova aparece (~0,35 s/linha, 4–9 s). Não narre por cima; a fala seguinte traz a consequência.
   Se o mesmo arquivo reaparece logo depois, use `read: 2` ou `read: 3` (o aluno acabou de ler).
2. **Duração: 5 a 7 minutos.** As aulas 02–04 ficaram entre 3 e 4 min por falta de profundidade, não por ritmo.
   Mire em 700–950 palavras de fala + pausas. Profundidade = um segundo exemplo, um contraexemplo, um caso de borda,
   uma pergunta difícil do Téo — nunca enchimento.
3. **Uma descoberta a cada 10–20 s** (troca de cena, revelação, teste falhando/passando). Mediana medida: 8–14 s.
4. **Variar o gancho.** Nas aulas 01–04 todo gancho foi "um bug/incidente". Alterne com: uma pergunta polêmica, um
   desafio ("qual dessas duas classes é melhor?"), um número surpreendente, uma decisão de produto, um "e se…".
5. **Mistério fechado explicitamente** no fim ("agora os três mil e-mails fazem sentido").

## Voz (Kokoro + ouvido automático)
6. **Perguntas de sim/não**: o Kokoro termina tudo caindo. O motor agora sobe o tom no fim de toda frase com "?"
   (medido: −2,8 → −0,3 semitons). Mesmo assim, **ajude pelo texto**: perguntas curtas, com a palavra-chave no fim
   ("Tudo isso num método só?"), ou com marcador ("Será que…?", "…, né?", "E se…?"). Evite pergunta longa com
   vírgulas no meio.
7. **Palavras em inglês**: prefira o termo em português quando existir. Se precisar do inglês, use `say` com a grafia
   que soa certo, ou confira no laboratório (`scripts/lexicon-lab.ts`). Já testado: "e-mail(s)" fica melhor ESCRITO
   NORMAL; "OrderService" → "órder sérvis"; "checkout" → "chéquiaute".
8. **Nomes de código na fala** (`method.price`, `dryRun`): fale em português no `say` ("o preço do método",
   "dry run") e deixe o nome técnico na legenda/tela.
9. **Números**: escreva por extenso na fala ("duzentos e dez reais"); na tela, use dígitos.
10. **Controle de qualidade** de toda aula: `node scripts/asr-check.ts <aula>` (erro de palavras e perguntas
    percebidas) e `node scripts/pitch-check.ts <aula>` (subida do tom nas perguntas).

## Técnica
11. Tudo que aparece em terminal na tela vem de uma execução real (copie a saída).
12. Regra de negócio usada no raciocínio é dita e escrita no código (ex.: frete grátis sobre o subtotal).
13. Em zsh, lista de ids em variável precisa de `${=VAR}` para virar argumentos separados.

## Do lote das aulas 05–24 (2026-11-19)
14. **Medir antes de corrigir.** O ouvido automático inflava o erro em ~3 pontos: números falados × dígitos
    ("trinta e cinco reais" × "R$ 35") e grafias fonéticas do `say`. Agora a referência é a legenda e números
    são normalizados. Mesma aula 07, mesmo áudio: 9,2% → 5,8%.
15. **Erro que importa é o que se repete entre aulas** (`scripts/asr-aggregate.ts`). Corrigidos pelo laboratório:
    "checkout" → "chéc-áuti" (a grafia antiga "chéquiaute" ERA o problema), "SOLID" → "sólidi",
    "Postgres" → "pôust grés". Não são defeito: "olha"→"olhe" (Whisper), "frete", "pera aí", "Pix" (acaso de contexto).
16. **Grafia fonética não é sempre melhor.** "imêius", "cômites", "chéquiaute" pioraram palavras que saíam certas
    escritas normalmente. Teste no laboratório antes de colocar no dicionário ou no `say`.
17. **Renumeração com busca-e-troca é perigosa**: trocou ids de nós de um grafo (aula 12) e quebrou o render. O
    build agora valida setas do grafo; e destaques de código que não acham linha devem ser conferidos.
18. **Caractere invisível** (espaço inseparável depois de "R$") não casa com destaque escrito como `u00a0`.
19. **Tabela longa** (8+ linhas) estourava o painel: a cena agora encolhe as linhas para caber.
20. **Duração**: com a regra dos 700–950 palavras, todas as aulas 05–24 ficaram entre 5:13 e 7:08.
