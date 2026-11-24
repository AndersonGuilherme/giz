import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { SafeArea } from '../layout/SafeArea.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';
import type { Hud } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';

export type HudText = Readonly<{ text: string; rectangle: Rectangle; fit: Fit; font: Font }>;
export type HudBar = Readonly<{ label: HudText; track: Rectangle; fill: Rectangle; percent: string; percentArea: Rectangle }>;
/** Everything the HUD draws, in video pixels; `boxes()` is what the `check` sees. */
export type HudDrawing = Readonly<{ panel: Rectangle; fields: HudText; bar?: HudBar; boxes: () => Boxes }>;

type Measures = Readonly<{ width: number; padding: number; gap: number; track: number; percent: number; fields: Font; bar: Font }>;

// The HUD lines are heavy capitals, measured as `display`. The panel takes about 40% of the 16:9 width and 80% of the 9:16 safe area, like the reference HUDs.
const HORIZONTAL: Measures = {
  width: 720, padding: 18, gap: 8, track: 14, percent: 96,
  fields: Font.of({ family: 'display', size: 34, lineHeight: 1.25, maximumLines: 1 }),
  bar: Font.of({ family: 'display', size: 24, lineHeight: 1.25, maximumLines: 1 }),
};
const VERTICAL: Measures = {
  width: 760, padding: 20, gap: 10, track: 16, percent: 110,
  fields: Font.of({ family: 'display', size: 38, lineHeight: 1.25, maximumLines: 1 }),
  bar: Font.of({ family: 'display', size: 28, lineHeight: 1.25, maximumLines: 1 }),
};
const SEPARATOR = ' · ';

const bottomOf = (rectangle: Rectangle): number => rectangle.y + rectangle.height;

function textAt(text: string, rectangle: Omit<Rectangle, 'height'>, font: Font): HudText {
  return { text, rectangle: { ...rectangle, height: font.maximumHeight() }, fit: TextFit.measure(text, font, rectangle.width), font };
}

function barBelow(bar: NonNullable<Hud['bar']>, above: Rectangle, measures: Measures): HudBar {
  const width = above.width - measures.percent;
  const label = textAt(bar.label, { x: above.x, y: bottomOf(above) + measures.gap, width }, measures.bar);
  const track = { x: above.x, y: bottomOf(label.rectangle) + measures.gap / 2, width, height: measures.track };
  const value = Math.max(0, Math.min(100, bar.value));
  const percentArea = { x: above.x + width, y: label.rectangle.y, width: measures.percent, height: bottomOf(track) - label.rectangle.y };
  return { label, track, fill: { ...track, width: (track.width * value) / 100 }, percent: `${Math.round(value)}%`, percentArea };
}

function boxesOf(fields: HudText, bar: HudBar | undefined): Boxes {
  const boxes = Boxes.of([Box.withText('HUD (campos)', fields.rectangle, fields)]);
  if (!bar) return boxes;
  const label = Box.withText('HUD (barra)', bar.label.rectangle, bar.label);
  return boxes.with(label).with(Box.of('HUD (porcentagem)', bar.percentArea));
}

/** The HUD panel in the top left corner of the safe area: the fields on one line, then the optional bar with its label. */
export class HudLayout {
  static for(hud: Hud, aspect: AspectRatio): HudDrawing {
    const measures = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const safeArea = SafeArea.for(aspect);
    const inner = { x: safeArea.x + measures.padding, y: safeArea.y + measures.padding, width: measures.width - 2 * measures.padding };
    const text = hud.fields.map(({ label, value }) => `${label} ${value}`).join(SEPARATOR);
    const fields = textAt(text, inner, measures.fields);
    const bar = hud.bar && barBelow(hud.bar, fields.rectangle, measures);
    const last = bar?.track ?? fields.rectangle;
    const panel = { x: safeArea.x, y: safeArea.y, width: measures.width, height: bottomOf(last) + measures.padding - safeArea.y };
    return { panel, fields, bar, boxes: () => boxesOf(fields, bar) };
  }
}
