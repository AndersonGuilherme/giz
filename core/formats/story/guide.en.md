# Story format guide (en)

A short animated story: scenarios (`scenario`) with drawn characters, an optional narrator (voice only) and
word-by-word captions. It fits "What if…?" ideas, curiosities, small comedies and made-up legends.

## Structure

Split the target duration into these parts (the times are proportional):

| Part | Share of the time | What happens |
|---|---|---|
| Hook | first 3 s | A question, an absurd situation or a surprising number that already shows the problem. |
| Setup | up to ~20% | Who the characters are and what the rule of this world is. |
| Escalation | ~50% | 2 to 4 turns, each with a bigger consequence than the last, each in a new scene. |
| Climax | ~15% | The worst moment or the big surprise. |
| Ending | last ~15% | A short resolution and a closing line that sticks (or a question for the viewer). |

- `chapters`: 3 to 6 short names that mark progress ("Hour 0", "Hour 3", "The plan", "The end").
- The ending answers the question opened by the hook.

## A good hook

- Concrete and visual within 3 s: "Imagine: the whole world's internet shuts down for a day."
- It opens a question only the ending answers. Never start with "Hi, today we're going to talk about…".
- The first line, 6 words at most, lands the hook; its `scene`'s `highlight` (up to 4 words, in CAPITALS) and `zoom-in`
  camera make it visual at once.

## Pacing

- The voice speaks about **2.2 words per second** in English, pauses included: 30 s ≈ 66 words, 60 s ≈ 132 words.
  Add up the words of all lines and stay within 10% of the target.
- Short lines: about 10 words at most. A longer line needs a `beat` or a camera change in the middle.
- `text` is a caption: keep it short. What the voice spells out (numbers, acronyms, names) goes in `pronunciation`.
- A new scene every 5 to 10 s (every 1 to 3 lines). The screen never stays still for more than ~6 s without a
  change (scene, camera, reaction, HUD, big text).

## Craft

- Every character wants something, and something is at stake: say it early ("if the cat skips dinner, it sues us").
- Plant and pay off: a detail from the start comes back at the end (a callback) and rewards the wait.
- Close with a twist or a button: one last short, unexpected line after the resolution.

## Tone and dialogue

- Spoken, not written: "Wait…", "Look at this mess", never "In this video we will see…".
- The humor comes from the situation and from each character's personality (use the presets' `personality`).
- Do not describe what the screen already shows: point at the consequence.
- A long line is followed by a short reaction from another character.

## Characters

- At most 2 characters with a body in the same scene in 9:16, and 3 in 16:9. Whoever speaks (except the narrator)
  is on stage.
- The narrator is a character without a `rig` (id `narrator`), with a voice and `defaultExpression: "neutral"`.
- A new character uses a rig and only the listed parameters. Its English `voice.style` starts with
  "Speak in natural American English, …".
- Restrained motion: a strong gesture (`celebrate`, `hand-on-head`, `hands-on-mouth`) only at an emotional peak.
  Otherwise `explain`, `point`, `think` or `neutral`, with `happy`, `neutral` or `thinking`. The same expression for
  at most 3 lines in a row.
- Listeners react: fill `reaction` on the important lines. Use `look` on purpose (`camera` when talking to the
  viewer, `other` when talking to the other character).

## Scenes

- Every scene is a `scenario`. Use a vector background (`background.vector`) or copy a scene preset and fill
  `characters`.
- Vary the camera: `zoom-in` on the hook, `follow` the speaker, `pan` for time passing, `shake` only for tension.
- Effects sparingly (`rain`, `snow`, `fire`, `vignette`, `tint`), always serving the moment.
- `hud` for counters that change (hour, day, panic level); declare the scene again to change the value.
- `highlight`: up to 4 words. No text may leave the safe area: short texts fit.

## Voice and pronunciation

- Write acronyms normally in `text` and, when the voice would misread them, the spoken form in `pronunciation`.
- Numbers: digits in `text`, spelled out in `pronunciation` when the reading is ambiguous.
- Short questions with the key word at the end ("All of that in one day?").
- The number of `[spans]` in the text equals the number of `beats`. Use beats only when something changes mid-line.

## Originality

The story, characters, lines and jokes are original. Never imitate, copy or reference any specific existing video,
channel, creator, show, film, game or character.
