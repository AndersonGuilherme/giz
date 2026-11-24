# Guia editorial — Lia e Téo

A dupla que apresenta todas as aulas feitas com o giz, em qualquer curso. O aluno precisa reconhecê-los, gostar de
acompanhá-los e querer encontrá-los na próxima aula. Ficha visual: [ficha-lia-teo.png](ficha-lia-teo.png).
Configuração técnica (voz, ritmo, visual): [`motor/src/cast.ts`](../motor/src/cast.ts).

## Quem são

| | **Lia** | **Téo** |
|---|---|---|
| Papel | Mentora de tecnologia | Desenvolvedor curioso |
| Personalidade | Carismática, segura, didática. Explica o difícil com exemplos simples e surpreendentes. | Prático, bem-humorado, questionador. Traz os problemas do dia a dia e as dúvidas do aluno. |
| Posição na tela | Esquerda | Direita (mais perto do conteúdo) |
| Visual próprio | Coque, moletom violeta com broche de estrela, sobrancelha fina e arqueada, tênis roxo | Cabelo arrepiado, moletom índigo com `</>`, sobrancelha grossa e reta, tênis branco |
| Voz (Qwen3-TTS) | `vivian` (padrão) — clara e marcante; cada instalação pode trocar no `npm run setup` | `dylan` (padrão) — jovem e natural |
| Expressões típicas | explicando, sorrindo, pensando, desconfiada, preocupada | empolgado, desconfiado, confuso, surpreso, comemorando |

Por que esses nomes: curtos, fáceis de lembrar e de pronunciar no TTS; **Téo** soa leve e amigável, **Lia**
tem uma associação sutil com IA; funcionam em título e thumbnail ("Téo e Lia explicam SOLID") e não prendem a
dupla a um curso.

## Como os dois conversam

1. **Dois profissionais, não professora e aluno.** Téo é competente e tem boas ideias; às vezes escolhe a
   solução que *parece* certa (o `dryRun`), e é isso que revela o problema maior. Ele não erra por ser ingênuo.
2. **Lia também é desafiada.** Téo questiona ("então é só reescrever do zero?"), e ela precisa justificar.
   Ela pode concordar com ele, mudar de ideia ou dizer "depende".
3. **Quem escuta reage.** Toda fala define a reação do outro (`react`): desconfiado, surpreso, pensativo.
   Boneco parado ouvindo é o que mais denuncia "vídeo feito por IA".
4. **Olhar com intenção.** Quem fala olha para o conteúdo, para o colega ou para a câmera (`look`). Fala dirigida
   ao aluno ("Consegue achar o problema?") é sempre `look: 'viewer'`.

## Regras de escrita do diálogo

- **Falado, não escrito.** Nada de "Ao final desta aula você vai conseguir…" ou "Resumindo. Um: …".
  Prefira "Percebeu o padrão?", "Pera aí…", "Olha o estrago".
- **Não descreva o que está na tela.** Com o código à vista, faça uma pergunta ou aponte a consequência e deixe
  a animação (destaques, diff) completar.
- **Mistério no segundo zero.** O gancho revela o desastre em até 8 s e deixa uma pergunta que atravessa a aula,
  respondida aos poucos (pistas).
- **Uma descoberta a cada 10–20 s:** troca de cena, revelação, teste falhando, pista nova. Sem cortes aleatórios.
- **Código precisa de tempo de leitura.** Todo código novo na tela ganha uma pausa automática "Leia o código"
  (~0,35 s por linha, 4–9 s). Não narre por cima disso; use a fala seguinte para a consequência.
- **O aluno participa.** Antes de revelar, pergunte e dê tempo (`hold`, 2–3 s com contagem "Ache o bug").
- **Frase-chave uma vez só**, no final. No resto, reformule.
- **Rigor técnico.** Toda regra de negócio usada no raciocínio é dita explicitamente (ex.: "frete grátis sobre o
  subtotal, antes de descontos"). Causas são apresentadas como causas comuns, não únicas.
- **Honestidade.** Incidente inventado leva o aviso "Cenário simulado para fins didáticos" na tela.
- **Falas curtas.** Até ~2 frases por fala; uma fala longa da Lia é seguida de uma reação curta do Téo.

## Três camadas por fala (no `roteiro.ts`)

| Camada | Campo | Para quê |
|---|---|---|
| Pedagógica | `text` | O que é dito. Vira a legenda. |
| Voz | `say` | Opcional. Versão para o TTS: pausas `<pausa 0.3>`, grafia que soa melhor. Pronúncia de termos fica em `cursos/<curso>/pronuncia.json`. |
| Visual | `scene`, `beats`, `pose`, `expr`, `look`, `react`, `hold`, `sfx` | O que se vê e ouve além da voz. |

Trocar de motor de voz não exige reescrever cursos: muda `cast.ts` e, se preciso, alguns `say`.

## Vocabulário visual

- **Poses:** `neutral` · `explain` (mãos abertas) · `point` (aponta o conteúdo) · `wave` · `raise` (mão erguida:
  ideia, pergunta) · `think` (mão no queixo) · `shrug` (ombros, "fazer o quê") · `celebrate`.
- **Expressões:** `neutral` · `happy` · `excited` · `surprised` · `confused` · `thinking` · `skeptical` · `concerned`.
- **Boca:** segue os fonemas da fala (lábios fechados em m/b/p, arredondados em o/u, abertos em a…) com a
  abertura dada pelo volume. Em silêncio, mostra a boca da expressão.
- **Efeitos sonoros:** `whoosh` em toda troca de cena (automático), `pop` em revelação, `success` ao nomear uma
  pista, `error` em teste quebrando, `dings` nas notificações, `tick` na contagem. Volume baixo: a voz manda.

## O que evitar

- Lia corrigindo Téo o tempo todo.
- Fala que lê o código linha a linha.
- Mesma expressão por mais de 3 falas seguidas.
- Piadas que envelhecem ou dependem de meme do momento.
- Afirmar como fato real algo que foi simulado.
