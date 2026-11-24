import type { Phonemizer } from '../../src/application/ports/Phonemizer.ts';

/** Always returns the same phonetics: "mama" (visemes M A M A). */
export class FakePhonemizer implements Phonemizer {
  async ipa(): Promise<string> {
    return 'mama';
  }
}
