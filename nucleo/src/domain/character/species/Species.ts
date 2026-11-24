import type { CharacterState } from '../CharacterState.ts';
import type { EyesState } from '../FaceGeometry.ts';
import type { HeadPart } from '../HeadPart.ts';
import { HeadProfile } from '../HeadProfile.ts';
import type { HeadShapeName } from '../HeadShape.ts';
import { MouthLayout, type MouthParts } from '../MouthLayout.ts';
import { SkinTone, type SkinToneName } from '../SkinTone.ts';
import { BARE_LEGS, type OutfitPalette, type Sleeve } from '../wardrobe/OutfitDesign.ts';
import { ALIEN } from './alien.ts';
import { fangsOf, type Fang } from './Fangs.ts';
import { GHOST } from './ghost.ts';
import { MUMMY } from './mummy.ts';
import { ROBOT } from './robot.ts';
import { SLIME_MONSTER } from './slimeMonster.ts';
import { species, type EyeStyle, type SpeciesDesign } from './SpeciesDesign.ts';
import { VAMPIRE } from './vampire.ts';
import { WEREWOLF } from './werewolf.ts';
import { ZOMBIE } from './zombie.ts';

const DESIGNS = {
  human: species({}),
  zombie: ZOMBIE,
  vampire: VAMPIRE,
  werewolf: WEREWOLF,
  mummy: MUMMY,
  ghost: GHOST,
  robot: ROBOT,
  alien: ALIEN,
  'slime-monster': SLIME_MONSTER,
} as const satisfies Readonly<Record<string, SpeciesDesign>>;

export type SpeciesName = keyof typeof DESIGNS;
export const SPECIES = Object.keys(DESIGNS) as SpeciesName[];

/** The mouth the state's viseme or expression made, unchanged (lip-sync works the same), plus the species' fangs. */
export type SpeciesMouth = Readonly<{ parts: MouthParts; fangs: readonly Fang[] }>;
/** One wrap round a limb: how far along it (from its top, in drawing units) and which way it slants (-1 or 1). */
export type Wrap = Readonly<{ at: number; slant: -1 | 1 }>;
/** How far a floating creature is lifted (negative: up, in drawing units) and how much its ground shadow shrinks. */
export type Lift = Readonly<{ y: number; shadow: number }>;

const GROUNDED: Lift = { y: 0, shadow: 1 };
const LARGEST_EYES = 1.5;
const SHADOW_PER_UNIT = 0.006;
const BUILT = new Map<string, readonly HeadPart[]>();

/** The creatures of the giz rig: one body, so every pose, expression and viseme still works; the rules live here. */
export class Species {
  static readonly DEFAULT: SpeciesName = 'human';

  /** Humans keep the chosen tone; a creature keeps its own unless the character chose another creature skin. */
  static skin(name: SpeciesName, chosen: SkinToneName): SkinToneName {
    const { tone } = DESIGNS[name] as SpeciesDesign;
    return tone && !SkinTone.isCreature(chosen) ? tone : chosen;
  }

  static hasLegs(name: SpeciesName): boolean {
    return DESIGNS[name].legs;
  }

  static isClothed(name: SpeciesName): boolean {
    return DESIGNS[name].clothed;
  }

  /** Without clothes the arms are bare. */
  static sleeve(name: SpeciesName, sleeve: Sleeve): Sleeve {
    return DESIGNS[name].clothed ? sleeve : 'bare';
  }

  /** Without clothes the legs and feet are skin. */
  static palette(name: SpeciesName, palette: OutfitPalette): OutfitPalette {
    return DESIGNS[name].clothed ? palette : { ...palette, legs: BARE_LEGS, shoes: BARE_LEGS };
  }

  static opacity(name: SpeciesName): number {
    return DESIGNS[name].opacity;
  }

  /** A floating creature hovers and bobs gently (one sine per period); the others stand on the ground. */
  static lift(name: SpeciesName, seconds: number): Lift {
    const float = (DESIGNS[name] as SpeciesDesign).float;
    if (!float) return GROUNDED;
    const height = float.height + Math.sin((seconds / float.period) * 2 * Math.PI) * float.bob;
    return { y: -height, shadow: 1 - height * SHADOW_PER_UNIT };
  }

  /** The highest a floating creature rises above the ground (its hover plus its bob, drawing units); 0 when grounded. */
  static highestFloat(name: SpeciesName): number {
    const float = (DESIGNS[name] as SpeciesDesign).float;
    return float ? float.height + float.bob : 0;
  }

  /** Bandage wraps along a limb `length` long, from end to end, slanting one way then the other (none if unwrapped). */
  static wraps(name: SpeciesName, length: number): readonly Wrap[] {
    const spacing = (DESIGNS[name] as SpeciesDesign).wraps;
    if (spacing <= 0 || length <= 0) return [];
    const count = Math.ceil(length / spacing);
    return Array.from({ length: count }, (_empty, index) => ({ at: ((index + 0.5) * length) / count, slant: index % 2 === 0 ? 1 : -1 }));
  }

  static eyeStyle(name: SpeciesName): EyeStyle {
    return DESIGNS[name].eyes.style;
  }

  /** The chosen eye size times the species' (big alien eyes), never so big that the eyes touch. */
  static eyeScale(name: SpeciesName, chosen: number): number {
    return Math.min(LARGEST_EYES, chosen * DESIGNS[name].eyes.scale);
  }

  /** The expression's eyes; a droopy left lid never opens past the droop (a blink still closes it). */
  static eyes(name: SpeciesName, eyes: EyesState): EyesState {
    const { droop } = DESIGNS[name].eyes;
    return { ...eyes, left: { ...eyes.left, upper: Math.max(eyes.left.upper, droop) } };
  }

  static mouth(name: SpeciesName, state: CharacterState): SpeciesMouth {
    const parts = MouthLayout.for(state);
    return { parts, fangs: DESIGNS[name].fangs ? fangsOf(parts.outline) : [] };
  }

  /** The species' features on the head (ears, stitches, bandages, antennae…), built once per head shape. */
  static parts(name: SpeciesName, shape: HeadShapeName): readonly HeadPart[] {
    const key = `${name}|${shape}`;
    const known = BUILT.get(key) ?? DESIGNS[name].parts(HeadProfile.of(shape));
    BUILT.set(key, known);
    return known;
  }
}
