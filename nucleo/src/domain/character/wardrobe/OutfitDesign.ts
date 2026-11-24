export type Era = 'past' | 'present' | 'future';
export const ERAS: readonly Era[] = ['past', 'present', 'future'];

/** How far the sleeves reach: none (bare arms), to the elbow, or to the wrist. */
export type Sleeve = 'bare' | 'short' | 'long';

/** The legs color `skin` means bare legs (a toga, shorts, a short dress). */
export const BARE_LEGS = 'skin';

/** `main` is the body of the outfit (`outfitColor`), `accent` its trim (`accessoryColor`). */
export type OutfitPalette = Readonly<{ main: string; accent: string; sleeve: string; legs: string; shoes: string }>;

export type OutfitDesign = Readonly<{ era: Era; sleeve: Sleeve; palette: OutfitPalette }>;
