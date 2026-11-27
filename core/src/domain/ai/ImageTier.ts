import type { PixelSize } from '../scenario/ScenarioImageFrame.ts';

/** The resolution classes some services price and size by (Gemini): about 1024, 2048 or 4096 pixels on a side. */
export const IMAGE_TIERS = ['1K', '2K', '4K'] as const;
export type ImageTier = (typeof IMAGE_TIERS)[number];

// The largest longest side each class is asked for; 2K covers the 2160-pixel side of a scenario image.
const LONGEST_SIDE: Readonly<Record<ImageTier, number>> = { '1K': 1024, '2K': 2560, '4K': Infinity };

/** The smallest class that holds the size's longest side. */
export function imageTierOf(size: PixelSize): ImageTier {
  const longest = Math.max(size.width, size.height);
  return IMAGE_TIERS.find((tier) => longest <= LONGEST_SIDE[tier]) ?? '4K';
}
