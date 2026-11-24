import type { HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';

/** `main` is the body of the piece (the `headwearColor` parameter replaces it), `accent` its trim, gems or band. */
export type HeadwearPalette = Readonly<{ main: string; accent: string }>;

/** A piece worn on the head: its default colors and its shapes, built on the head profile. */
export type HeadwearDesign = Readonly<{ palette: HeadwearPalette; parts: (profile: HeadProfile) => readonly HeadPart[] }>;
