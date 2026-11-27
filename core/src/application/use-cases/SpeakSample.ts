import { Audio } from '../../domain/speech/Audio.ts';
import { Envelope } from '../../domain/speech/Envelope.ts';
import { VisemeMap } from '../../domain/speech/Visemes.ts';
import type { Language } from '../../domain/values/Language.ts';
import { Fps } from '../../domain/values/Time.ts';
import type { Phonemizer } from '../ports/Phonemizer.ts';
import type { VoiceProvider } from '../ports/VoiceProvider.ts';

/** What to say and with which voice (a character being made: there is no line yet). */
export type SampleRequest = Readonly<{ text: string; voice: string; style?: string; language: Language }>;
/** The audio as a line gets it (trimmed, normalized), with its mouth: the opening and the viseme of each frame. */
export type SpokenSample = Readonly<{ audio: Audio; envelope: number[]; visemes: string }>;
type Dependencies = Readonly<{ voice: VoiceProvider; phonemizer: Phonemizer }>;

const SAMPLE_LINE = 'sample';

/** "Ouvir amostra": one short sentence with a voice, before any line uses it, with the mouth shapes to animate it. */
export class SpeakSample {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async run(request: SampleRequest): Promise<SpokenSample> {
    const { voice, phonemizer } = this.#dependencies;
    const raw = await voice.generate({ ...request, lineId: SAMPLE_LINE });
    const audio = processed(raw);
    const envelope = Envelope.measure(audio, Fps.DEFAULT);
    const ipa = await phonemizer.ipa(request.text, request.language);
    const map = VisemeMap.for(request.language);
    const visemes = map.convert(ipa);
    return { audio, envelope: envelope.toJson(), visemes: visemes.spreadOver(envelope.voicedFrames()) };
  }
}

function processed(raw: Audio): Audio {
  const trimmed = raw.trimmed();
  return trimmed.normalized();
}
