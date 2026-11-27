import { Audio } from '../../domain/speech/Audio.ts';
import { Envelope } from '../../domain/speech/Envelope.ts';
import { VisemeMap } from '../../domain/speech/Visemes.ts';
import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import { Fps } from '../../domain/values/Time.ts';
import { voiceFile, type VoiceStore } from '../ports/VoiceStore.ts';
import type { Aligner } from '../ports/Aligner.ts';
import type { Phonemizer } from '../ports/Phonemizer.ts';
import type { VoiceRequest, VoiceProvider } from '../ports/VoiceProvider.ts';
import { currentVoice } from './voiceHash.ts';

export type Progress = Readonly<{ done: number; total: number; lineId: string; generated: boolean }>;
export type VoiceReport = { generated: string[]; skipped: string[] };
type Dependencies = Readonly<{ voice: VoiceProvider; phonemizer: Phonemizer; store: VoiceStore; aligner: Aligner }>;

const nothingToDo = () => undefined;

/** Generates the voice, envelope and visemes of each line; lines whose hash is already saved are skipped. */
export class GenerateVoices {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async run(project: Project, onProgress: (progress: Progress) => void = nothingToDo): Promise<VoiceReport> {
    const script = project.script();
    const all = script.lines();
    const lines = all.each();
    const report: VoiceReport = { generated: [], skipped: [] };
    for (const [index, line] of lines.entries()) {
      const generated = await this.#process(project, line);
      (generated ? report.generated : report.skipped).push(line.id());
      onProgress({ done: index + 1, total: lines.length, lineId: line.id(), generated });
    }
    return report;
  }

  async #process(project: Project, line: Line): Promise<boolean> {
    const { store, voice } = this.#dependencies;
    const { request, hash } = await currentVoice(project, line, voice);
    if (store.savedHash(line.id()) === hash) return false;
    await this.#save(line, request, hash);
    return true;
  }

  // The words come from the script text (what the caption shows), not from the pronunciation.
  async #save(line: Line, request: VoiceRequest, hash: string): Promise<void> {
    const { voice, store, aligner } = this.#dependencies;
    const audio = processed(await voice.generate(request));
    const envelope = Envelope.measure(audio, Fps.DEFAULT);
    const visemes = await this.#visemes(request, envelope);
    const words = await aligner.align(audio, line.text(), request.language);
    const duration = audio.duration();
    const record = {
      file: voiceFile(request.lineId), hash, durationSeconds: duration.value(), envelope: envelope.toJson(), visemes, words: words.toJson(),
    };
    await store.save(request.lineId, record, audio);
  }

  async #visemes(request: VoiceRequest, envelope: Envelope): Promise<string> {
    const { phonemizer } = this.#dependencies;
    const ipa = await phonemizer.ipa(request.text, request.language);
    const map = VisemeMap.for(request.language);
    const sequence = map.convert(ipa);
    return sequence.spreadOver(envelope.voicedFrames());
  }
}

function processed(raw: Audio): Audio {
  const trimmed = raw.trimmed();
  return trimmed.normalized();
}
