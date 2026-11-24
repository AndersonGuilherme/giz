import type { EstadoDoPersonagem } from './EstadoDoPersonagem.ts';
import { MouthGeometry, type SilentMouth, type SpeechShape } from './MouthGeometry.ts';

// Everything in face units: x from the mouth center, y from the mouth line (positive = down).
export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type Oval = Readonly<{ cx: number; cy: number; rx: number; ry: number }>;

export type MouthOutline =
  | Readonly<{ kind: 'pressed'; width: number }>
  | Readonly<{ kind: 'line'; width: number; tilt: number; bend: number }>
  | Readonly<{ kind: 'wave'; width: number; tilt: number; wave: number }>
  | Readonly<{ kind: 'cubic'; width: number; tilt: number; upper: number; lower: number }>
  | Readonly<{ kind: 'oval'; width: number; height: number; center: number }>
  | Readonly<{ kind: 'rounded'; width: number; height: number; center: number; corner: number }>;

/** The outline plus the interior parts; the drawing clips the parts to the outline. */
export type MouthParts = Readonly<{ outline: MouthOutline; teeth?: Rect; tongue?: Oval; lip?: Rect }>;

type Flags = Readonly<{ teeth: boolean; tongue: boolean; lipTuck: boolean }>;

const COVER = 28; // half width of the interior bands: wider than any mouth, the outline clips them
const PADDING = 1;
const TEETH_SHARE = 0.34;
const TUCKED_TEETH_SHARE = 0.55; // with the lower lip tucked, the top teeth fill more of the mouth
const TONGUE_SHARE = 0.35;
const TONGUE_HALF_WIDTH = 11;
const SPEECH_DROP = 0.3; // the speaking mouth hangs a little below the mouth line
const CUBIC_REACH = 0.75; // a cubic with both controls at y only reaches 3/4 of y

function interior(top: number, bottom: number, flags: Flags): Omit<MouthParts, 'outline'> {
  const height = bottom - top;
  const share = flags.lipTuck ? TUCKED_TEETH_SHARE : TEETH_SHARE;
  const band = (y: number, bandHeight: number): Rect => ({ x: -COVER, y, width: 2 * COVER, height: bandHeight });
  return {
    ...(flags.teeth ? { teeth: band(top - PADDING, Math.min(MouthLayout.MAXIMUM_TEETH, height * share) + PADDING) } : {}),
    ...(flags.tongue ? { tongue: { cx: 0, cy: bottom + PADDING, rx: TONGUE_HALF_WIDTH, ry: Math.max(MouthLayout.MINIMUM_TONGUE, height * TONGUE_SHARE) } } : {}),
    ...(flags.lipTuck ? { lip: band(top + height * TUCKED_TEETH_SHARE, height) } : {}),
  };
}

export class MouthLayout {
  static readonly MAXIMUM_TEETH = 6.4;
  static readonly MINIMUM_TONGUE = 3.7;
  static readonly MAXIMUM_CORNER = 4.6;

  static for(state: EstadoDoPersonagem): MouthParts {
    const mouth = MouthGeometry.forState(state);
    return mouth.speaking ? MouthLayout.ofSpeech(mouth.shape) : MouthLayout.ofSilent(mouth.shape);
  }

  static ofSpeech(shape: SpeechShape): MouthParts {
    if (shape.height === 0) return { outline: { kind: 'pressed', width: shape.width } };
    const halfHeight = shape.height / 2;
    const center = halfHeight * SPEECH_DROP;
    const box = { width: shape.width, height: shape.height, center };
    const outline: MouthOutline = shape.outline === 'wide'
      ? { kind: 'rounded', ...box, corner: Math.min(halfHeight, MouthLayout.MAXIMUM_CORNER) }
      : { kind: 'oval', ...box };
    return { outline, ...interior(center - halfHeight, center + halfHeight - PADDING, shape) };
  }

  static ofSilent(mouth: SilentMouth): MouthParts {
    const { width, tilt } = mouth;
    if (!mouth.open && mouth.wave > 0) return { outline: { kind: 'wave', width, tilt, wave: mouth.wave } };
    if (!mouth.open) return { outline: { kind: 'line', width, tilt, bend: mouth.upper } };
    const outline: MouthOutline = { kind: 'cubic', width, tilt, upper: mouth.upper, lower: mouth.lower };
    return { outline, ...interior(mouth.upper * CUBIC_REACH, mouth.lower * CUBIC_REACH, { ...mouth, lipTuck: false }) };
  }
}
