import type { Visema } from '../fala/Visemas.ts';
import type { EstadoDoPersonagem } from './EstadoDoPersonagem.ts';
import { FaceGeometry, type MouthShape } from './FaceGeometry.ts';

/**
 * Speaking mouth in face units (head radius = 100). Height 0 = closed lips.
 * `outline` oval or wide (flat, rounded corners); `lipTuck` = lower lip tucked under the top teeth (F, V).
 */
export type SpeechShape = Readonly<{
  width: number; height: number; teeth: boolean; tongue: boolean; outline: 'oval' | 'wide'; lipTuck: boolean;
}>;

/**
 * Silent (expression) mouth in face units, relative to the mouth line (positive = down).
 * Closed: `upper` = `lower` is the bend of the single line. Open: the upper and lower edges.
 */
export type SilentMouth = Readonly<{
  width: number; tilt: number; wave: number; open: boolean; upper: number; lower: number; teeth: boolean; tongue: boolean;
}>;

export type MouthOfState = Readonly<{ speaking: true; shape: SpeechShape }> | Readonly<{ speaking: false; shape: SilentMouth }>;

type Template = Readonly<{ width: number; baseHeight: number; heightPerOpening: number }> & Partial<Pick<SpeechShape, 'teeth' | 'tongue' | 'outline' | 'lipTuck'>>;

// Each viseme: fixed width, and height = fixed part + a part proportional to the frame's opening (volume).
const TEMPLATES: Readonly<Record<Visema, Template>> = {
  'X': { width: 0, baseHeight: 0, heightPerOpening: 0 },
  'M': { width: 24, baseHeight: 0, heightPerOpening: 0 },
  'A': { width: 28, baseHeight: 6, heightPerOpening: 22, teeth: true, tongue: true },
  'E': { width: 28, baseHeight: 8, heightPerOpening: 10, teeth: true },
  'I': { width: 38, baseHeight: 4, heightPerOpening: 4, teeth: true, outline: 'wide' },
  'O': { width: 20, baseHeight: 10, heightPerOpening: 14, tongue: true },
  'U': { width: 12, baseHeight: 8, heightPerOpening: 5 },
  'F': { width: 28, baseHeight: 9, heightPerOpening: 1, teeth: true, outline: 'wide', lipTuck: true },
  'C': { width: 16, baseHeight: 3, heightPerOpening: 5, teeth: true },
};

// Even at the end of a syllable the vowel must still read as open.
const MINIMUM_OPENING = 0.25;
const TONGUE_FROM_HEIGHT = 8;
const SILENT_TEETH_FROM_WIDTH = 24;
const SILENT_TONGUE_FROM_OPENING = 14;
const LINE_BEND = 1.6;

// Smiles open mostly downward, frowns mostly upward; the opening pushes the edges apart.
function openEdges({ curve, opening }: MouthShape): Readonly<{ upper: number; lower: number }> {
  const smiling = curve > 0;
  return {
    upper: curve * (smiling ? 0.3 : 1.2) - opening * 0.35,
    lower: curve * (smiling ? 1.2 : 0.3) + opening * 1.4,
  };
}

export class MouthGeometry {
  static for(viseme: Visema, opening: number): SpeechShape {
    const template = TEMPLATES[viseme];
    const clamped = Math.min(1, Math.max(MINIMUM_OPENING, opening));
    const height = template.baseHeight + template.heightPerOpening * clamped;
    return {
      width: template.width,
      height,
      teeth: template.teeth ?? false,
      tongue: (template.tongue ?? false) && height > TONGUE_FROM_HEIGHT,
      outline: template.outline ?? 'oval',
      lipTuck: template.lipTuck ?? false,
    };
  }

  static silent(shape: MouthShape): SilentMouth {
    const closed = { upper: shape.curve * LINE_BEND, lower: shape.curve * LINE_BEND };
    const open = shape.opening > 0;
    return {
      width: shape.width, tilt: shape.tilt, wave: shape.wave * LINE_BEND, open, ...(open ? openEdges(shape) : closed),
      teeth: open && shape.width >= SILENT_TEETH_FROM_WIDTH,
      tongue: shape.opening >= SILENT_TONGUE_FROM_OPENING,
    };
  }

  /** The viseme replaces the expression's mouth only while speaking and not at rest (X). */
  static forState(state: EstadoDoPersonagem): MouthOfState {
    if (state.estaFalando() && state.visema() !== 'X') return { speaking: true, shape: MouthGeometry.for(state.visema(), state.abertura()) };
    return { speaking: false, shape: MouthGeometry.silent(FaceGeometry.for(state.expressao()).mouth) };
  }
}
