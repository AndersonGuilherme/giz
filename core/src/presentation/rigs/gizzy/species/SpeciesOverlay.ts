import type { FC } from 'react';
import type { Hand } from '../../../../domain/character/ArmGeometry.ts';
import type { Paint } from '../HeadParts.tsx';
import type { Look } from '../parameters.ts';

export type OverlayProps = Readonly<{ look: Look }>;
/** A hand overlay draws in the hand's own coordinates (the forearm along +y, the palm near `ARM.fore`). */
export type HandOverlayProps = Readonly<{ look: Look; side: -1 | 1; shape: Hand }>;
/** The colors of an open mouth: the dark inside, the lips, the teeth and the tongue. */
export type MouthPaint = Readonly<{ inside: string; lips: string; teeth: string; tongue: string }>;

/**
 * What a species draws on the Gizzy body, all optional: how its head features are painted (by role), something behind
 * the body (a cape), something over the torso and legs or in their place (rips, wraps, a sheet, a blob), something on
 * each hand (claws, wraps) and the colors of its mouth.
 */
export type SpeciesOverlay = Readonly<{
  paints?: (look: Look) => Readonly<Record<string, Paint>>;
  Behind?: FC<OverlayProps>;
  Body?: FC<OverlayProps>;
  Hand?: FC<HandOverlayProps>;
  mouth?: Partial<MouthPaint>;
}>;
