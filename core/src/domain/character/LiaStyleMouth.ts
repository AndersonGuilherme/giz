import type { Viseme } from '../speech/Visemes.ts';
import type { CharacterState } from './CharacterState.ts';
import { LiaStyleGeometry, type LiaMouthShape } from './LiaStyleGeometry.ts';
import type { Oval, Rect } from './MouthLayout.ts';

/**
 * The lia-style mouth in the motor's units, relative to the mouth point (x from the center, y positive = down):
 * the expression's named shape when silent, a pressed line on M, or an open oval with teeth and tongue.
 */
export type LiaMouth =
  | Readonly<{ kind: 'expression'; shape: LiaMouthShape }>
  | Readonly<{ kind: 'closed'; halfWidth: number }>
  | Readonly<{ kind: 'open'; rx: number; ry: number; cy: number; teeth?: Rect; tongue?: Oval }>;

type OpenViseme = Exclude<Viseme, 'X' | 'M'>;

// The motor's speaking mouth per viseme: [half width, half height at the given opening].
const SIZES: Readonly<Record<OpenViseme, (opening: number) => readonly [number, number]>> = {
  'A': (opening) => [15, 4 + 15 * opening],
  'E': (opening) => [17, 3 + 9 * opening],
  'I': (opening) => [16, 2 + 6 * opening],
  'O': (opening) => [10, 6 + 10 * opening],
  'U': (opening) => [7, 5 + 6 * opening],
  'F': () => [14, 5],
  'C': (opening) => [13, 3 + 8 * opening],
};

const WITH_TEETH: readonly Viseme[] = ['E', 'I', 'F'];
const WITH_TONGUE: readonly Viseme[] = ['A', 'O'];
const PRESSED_HALF_WIDTH = 11;
const MINIMUM_OPENING = 0.25; // even at the end of a syllable the vowel still reads as open
const DROP = 0.35; // the open mouth hangs this share of its half height below the mouth line
const TEETH_SHARE = 0.7;
const MAXIMUM_TEETH = 6;
const TONGUE_FROM = 9; // half height: the tongue shows only on a wide-open A or O

function teethOf(rx: number, ry: number, cy: number): Rect {
  return { x: -rx * TEETH_SHARE, y: cy - ry, width: rx * TEETH_SHARE * 2, height: Math.min(MAXIMUM_TEETH, ry * 0.8) };
}

function open(viseme: OpenViseme, opening: number): LiaMouth {
  const [rx, ry] = SIZES[viseme](Math.max(MINIMUM_OPENING, Math.min(1, opening)));
  const cy = ry * DROP;
  return {
    kind: 'open', rx, ry, cy,
    ...(WITH_TEETH.includes(viseme) ? { teeth: teethOf(rx, ry, cy) } : {}),
    ...(WITH_TONGUE.includes(viseme) && ry > TONGUE_FROM ? { tongue: { cx: 0, cy: cy + ry * 0.5, rx: rx * 0.6, ry: ry * 0.35 } } : {}),
  };
}

export class LiaStyleMouth {
  /** The viseme replaces the expression's mouth only while speaking and not at rest (X). */
  static for(state: CharacterState): LiaMouth {
    const viseme = state.viseme();
    if (!state.isSpeaking() || viseme === 'X') return { kind: 'expression', shape: LiaStyleGeometry.face(state.expression()).mouth };
    if (viseme === 'M') return { kind: 'closed', halfWidth: PRESSED_HALF_WIDTH };
    return open(viseme, state.opening());
  }
}
