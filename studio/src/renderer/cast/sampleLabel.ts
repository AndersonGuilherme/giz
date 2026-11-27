import type { VoiceProgress } from '../../shared/voices.ts';

/**
 * The sample button's text: while the voices are being made, a sample waits for that job (the voice worker makes one
 * thing at a time), and the button says so instead of seeming stuck.
 */
export function sampleLabel({ sampling, voicesBusy }: Readonly<{ sampling: boolean; voicesBusy: boolean }>): 'cast.listen' | 'cast.sampling' | 'cast.sampleWaiting' {
  if (!sampling) return 'cast.listen';
  return voicesBusy ? 'cast.sampleWaiting' : 'cast.sampling';
}

/** Whether a voice job still runs after this progress (any line of it, until its end). */
export const voicesBusyAfter = (progress: VoiceProgress): boolean => progress.ended !== true;
