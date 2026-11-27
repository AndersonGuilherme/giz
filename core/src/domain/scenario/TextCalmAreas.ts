import { CAPTION_LAYOUTS } from '../caption/captionLayouts.ts';
import { SafeArea } from '../layout/SafeArea.ts';
import type { CaptionStyle, Format } from '../project/Project.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { HudLayout, TALLEST_HUD } from './HudLayout.ts';

/** Where the video's captions go: they depend on the project format and caption style. */
export type CaptionPlace = Readonly<{ format: Format; style: CaptionStyle }>;

/** The bands of the frame (fractions of its height) that text covers, so the image keeps them calm. */
export type CalmBands = Readonly<{ topUntil: number; captionFrom: number; captionTo: number }>;

/**
 * The top band, down to the tallest HUD panel or the safe area's top (titles and the HUD go there; in 9:16 the
 * Reels/Shorts interface too), and the caption band, from the caption box of the project's format and style.
 */
export function calmBands(aspect: AspectRatio, caption: CaptionPlace): CalmBands {
  const height = aspect.height();
  const { panel } = HudLayout.for(TALLEST_HUD, aspect);
  const safeArea = SafeArea.for(aspect);
  const box = CAPTION_LAYOUTS[caption.style].rectangle(aspect, caption.format);
  const topUntil = Math.max(panel.y + panel.height, safeArea.y) / height;
  return { topUntil, captionFrom: box.y / height, captionTo: (box.y + box.height) / height };
}
