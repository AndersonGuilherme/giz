import type { Visema } from '../fala/Visemas.ts';

/** Speaking mouth in face units (head radius = 100). Height 0 = closed lips. */
export type SpeechShape = Readonly<{ width: number; height: number; teeth: boolean; tongue: boolean }>;

type Template = Readonly<{ width: number; baseHeight: number; heightPerOpening: number; teeth?: boolean; tongue?: boolean }>;

// Each viseme: fixed width, and height = fixed part + a part proportional to the frame's opening (volume).
const TEMPLATES: Readonly<Record<Visema, Template>> = {
  'X': { width: 0, baseHeight: 0, heightPerOpening: 0 },
  'M': { width: 24, baseHeight: 0, heightPerOpening: 0 },
  'A': { width: 28, baseHeight: 6, heightPerOpening: 22, teeth: true, tongue: true },
  'E': { width: 32, baseHeight: 4, heightPerOpening: 12, teeth: true },
  'I': { width: 34, baseHeight: 3, heightPerOpening: 6, teeth: true },
  'O': { width: 20, baseHeight: 10, heightPerOpening: 14, tongue: true },
  'U': { width: 12, baseHeight: 8, heightPerOpening: 5 },
  'F': { width: 26, baseHeight: 6, heightPerOpening: 2, teeth: true },
  'C': { width: 22, baseHeight: 4, heightPerOpening: 9, teeth: true },
};

// Even at the end of a syllable the vowel must still read as open.
const MINIMUM_OPENING = 0.25;

export class MouthGeometry {
  static for(viseme: Visema, opening: number): SpeechShape {
    const template = TEMPLATES[viseme];
    const clamped = Math.min(1, Math.max(MINIMUM_OPENING, opening));
    return {
      width: template.width,
      height: template.baseHeight + template.heightPerOpening * clamped,
      teeth: template.teeth ?? false,
      tongue: template.tongue ?? false,
    };
  }
}
