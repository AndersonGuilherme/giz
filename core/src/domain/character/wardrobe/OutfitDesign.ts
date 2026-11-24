export type Era = 'past' | 'present' | 'future';
export const ERAS: readonly Era[] = ['past', 'present', 'future'];

/** How far the sleeves reach: none (bare arms), to the elbow, or to the wrist. */
export type Sleeve = 'bare' | 'short' | 'long';

/** The legs color `skin` means bare legs (a toga, shorts, a short dress). */
export const BARE_LEGS = 'skin';

/**
 * `main` is the body of the outfit (`outfitColor`), `accent` its trim (`accessoryColor`); `secondary` is the second
 * garment color: the sleeves, and the shirt, blouse or armor some outfits wear under or over the main piece.
 */
export type OutfitPalette = Readonly<{ main: string; accent: string; secondary: string; legs: string; shoes: string }>;

export type OutfitDesign = Readonly<{ era: Era; sleeve: Sleeve; palette: OutfitPalette }>;
