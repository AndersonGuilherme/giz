# Lesson format guide (en)

A lesson is an **investigation episode**: a mystery shows up at the start and is solved little by little, clue by
clue. It works for programming, math, history or cooking: the mystery changes, the format does not. The presenters
(at most 2 with a body, Lia and Téo by default, `lia` and `teo`) stand next to the content, which fills the lesson
scenes (`title`, `card`, `code`, `terminal`, `quote`, `chart`, `symptoms`, `graph`, `versus`, `table`, `inbox`,
`talk`). A `scenario` scene with both of them may open and close the lesson.

## Structure

The times below are for ~5 min; in a shorter lesson, use fewer clues (at least one) and shorten each part.

| Chapter | Share of the time | Role | Typical scene |
|---|---|---|---|
| The disaster | first ~8% | Hook: the problem shows up within 8 s and becomes a question | `card` (`ticket`), `inbox`, `scenario`, `title` |
| The suspect | ~15% | The object of study and why it "looks right" | `code`, `terminal` with passing tests |
| The clues | ~50% | Each clue is a concept, discovered in a concrete case | `code`, `terminal`, `card`, `graph`, `table` |
| The pause | inside a clue | The viewer tries to find it before the reveal | `holdAfter` of 2 to 3 s ("Find the bug") |
| The lesson | ~15% | The pattern behind the clues and the key sentence (once) | `symptoms`, `versus`, `quote` |
| Challenge | last ~7% | An exercise for now and the hook of the next lesson | `card` (`challenge`, `next`), `talk` |

- `chapters`: the short chapter names, in order; there may be several clue chapters.
- The opening mystery is explicitly closed at the end ("now the coupon makes sense").

## Teaching

- One central concept per lesson; the clues are facets of it.
- Every concept first appears in a concrete case and only then gets a name ("this has a name: **rigidity**").
- A discovery every 10 to 20 s: a scene change, a reveal, a test failing or passing.
- Vary the hook: an incident, a controversial question, a challenge, a surprising number, a "what if…".
- Rigor: every rule used in the reasoning is said out loud. Causes are common causes, not the only ones. A made-up
  case carries the notice "Simulated scenario for teaching purposes" on screen (for example, the `inbox` `note`).

## Pacing

- The voice speaks about **2.2 words per second** in English, pauses included: 60 s ≈ 132 words, 5 min ≈ 660 words.
  Add up the words of all lines and stay within 10% of the target. Code reading pauses and `holdAfter` come on top.
- Short lines, at most 2 sentences. A long line from the explainer is followed by a short reaction from the other.
- New code on screen gets an automatic reading pause (4 to 9 s). Do not talk over it: the next line brings the
  consequence. Code of up to ~20 short lines.

## Dialogue

- Two professionals, not teacher and student: the one who asks has good ideas and sometimes picks the solution that
  looks right; the one who explains is challenged too and may say "it depends".
- Spoken, not written: "Notice the pattern?", "Wait…". Never read the code line by line.
- Listeners react (`reaction`); the gaze has intent (`look`: `camera` when talking to the viewer, `other` to the
  colleague, `content` to the scene). A question to the viewer is `look: "camera"`.
- The key sentence only once, at the end. No jokes that depend on a current meme.
- Restrained motion: `explain`, `point`, `think`, `neutral` and the expressions `happy`, `neutral`, `thinking`;
  `surprised`, `worried` and `confused` only when the line calls for it; `celebrate` and `excited` almost never. The
  same expression for at most 3 lines in a row.

## Scenes and beats

- Use `[spans]` and `beats` to reveal items (`shown`), highlight code lines (`highlight`) or show terminal output
  (`lines`). The number of `[spans]` equals the number of `beats`.
- `terminal`: lines of up to ~52 characters, with `tone` `ok`, `fail` or `dim`.
- `table`: `columns` are only the columns of the cells (the `label` column has no header).
- `graph`: put neighbouring nodes to the left, right or diagonal; close nodes stacked vertically hide the arrow.

## Voice and pronunciation

- Code names: the technical name in `text` and the spoken form in `pronunciation` (`dryRun` → "dry run").
- Numbers: digits in `text`, spelled out in `pronunciation` ("$10" → "ten dollars").
- Short questions with the key word at the end.

## Originality

The mystery, the examples, the lines and any new character are original. Never imitate, copy or reference any
specific existing video, channel, creator, course, show or character.
