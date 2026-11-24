import type { AspectRatio } from '../values/AspectRatio.ts';
import { Box } from './Box.ts';

type Margins = Readonly<{ sides: number; top: number; base: number }>;

// In 9:16 the Reels and Shorts interface covers the top and, above all, the bottom (caption, buttons).
const VERTICAL_MARGINS: Margins = { sides: 0.08, top: 0.13, base: 0.22 };
const HORIZONTAL_MARGINS: Margins = { sides: 0.05, top: 0.05, base: 0.05 };

/** Region every text must stay in; the margins are rounded to whole pixels. */
export class SafeArea {
  static for(aspect: AspectRatio): Box {
    const margins = aspect.vertical() ? VERTICAL_MARGINS : HORIZONTAL_MARGINS;
    const side = Math.round(aspect.width() * margins.sides);
    const top = Math.round(aspect.height() * margins.top);
    const base = Math.round(aspect.height() * margins.base);
    return Box.of('área segura', { x: side, y: top, width: aspect.width() - 2 * side, height: aspect.height() - top - base });
  }
}
