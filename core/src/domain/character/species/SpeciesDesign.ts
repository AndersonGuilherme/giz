import type { HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import type { CreatureToneName } from '../SkinTone.ts';

/** How the eyes are drawn: a colored iris with a pupil, or a glowing LED that replaces the iris (robots). */
export type EyeStyle = 'iris' | 'led';

/** `scale` multiplies the chosen eye size; `droop` is how far the left upper lid always stays closed (0 to 1). */
export type EyeDesign = Readonly<{ style: EyeStyle; scale: number; droop: number }>;

/** A creature that floats: how high above the ground (drawing units), how much it bobs and how long one bob takes (s). */
export type FloatDesign = Readonly<{ height: number; bob: number; period: number }>;

/**
 * One species of the gizzy rig, drawn on the same body, so every pose, expression and viseme keeps working.
 * `tone`: its own skin (none: the chosen skin); `legs` false = no legs; `clothed` false = no outfit (the species draws
 * its own body); `fangs`: two small fangs on the mouth; `opacity` < 1 = see-through; `wraps`: the spacing of bandage
 * wraps round the arms and legs (0 = none); `parts`: features on the head.
 */
export type SpeciesDesign = Readonly<{
  tone?: CreatureToneName;
  legs: boolean;
  clothed: boolean;
  eyes: EyeDesign;
  fangs: boolean;
  float?: FloatDesign;
  opacity: number;
  wraps: number;
  parts: (profile: HeadProfile) => readonly HeadPart[];
}>;

const PLAIN: SpeciesDesign = {
  legs: true, clothed: true, eyes: { style: 'iris', scale: 1, droop: 0 }, fangs: false, opacity: 1, wraps: 0, parts: () => [],
};

/** A species that differs from a plain human only where it says so. */
export const species = (changes: Partial<Omit<SpeciesDesign, 'eyes'>> & Readonly<{ eyes?: Partial<EyeDesign> }>): SpeciesDesign =>
  ({ ...PLAIN, ...changes, eyes: { ...PLAIN.eyes, ...changes.eyes } });
