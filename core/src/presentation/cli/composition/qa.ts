// Part of the composition point (see composition.ts): the quality tools behind `giz qa`.
import { aggregatePronunciation } from '../../../infrastructure/qa/asrAggregate.ts';
import { checkPronunciation } from '../../../infrastructure/qa/asrCheck.ts';
import { compareSpellings, DEFAULT_SPELLING_TESTS, type SpellingTest } from '../../../infrastructure/qa/lexiconLab.ts';
import { checkQuestions } from '../../../infrastructure/qa/pitchCheck.ts';
import { compareVoices } from '../../../infrastructure/qa/voiceLab.ts';
import { WhisperTranscriber } from '../../../infrastructure/qa/WhisperTranscriber.ts';
import { projectRepository } from '../composition.ts';
import { installConfig } from './install.ts';

export type { SpellingTest } from '../../../infrastructure/qa/lexiconLab.ts';
type Log = (text: string) => void;

// QwenVoice loads onnxruntime-node: imported only by the labs that speak.
async function localVoice() {
  const { loadQwen } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return loadQwen(installConfig());
}

export const qa = {
  async asr(folder: string): Promise<string[]> {
    const project = await projectRepository().load(folder);
    return checkPronunciation({ folder, project, transcriber: new WhisperTranscriber() });
  },
  aggregate: (folder: string): string[] => aggregatePronunciation(folder),
  async pitch(folder: string): Promise<string[]> {
    return checkQuestions(folder, await projectRepository().load(folder));
  },
  async voices(output: string, options: Readonly<{ voices?: readonly string[]; instruct?: string }>, log: Log): Promise<void> {
    const tts = await localVoice();
    await compareVoices({ tts, transcriber: new WhisperTranscriber(), output }, options, log);
  },
  async lexicon(tests: readonly SpellingTest[] = DEFAULT_SPELLING_TESTS, voice: string, log: Log): Promise<void> {
    const tts = await localVoice();
    await compareSpellings({ tts, transcriber: new WhisperTranscriber(), voice }, tests, log);
  },
};
