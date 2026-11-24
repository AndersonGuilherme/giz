import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { fixedTexts, type FixedTexts } from '../i18n/fixedTexts.ts';
import type { CardScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Language } from '../values/Language.ts';
import { LessonStage } from './LessonStage.ts';
import { Reveal } from './Reveal.ts';
import { TextBlock } from './TextBlock.ts';

type Variant = CardScene['variant'];
type Measures = Readonly<{ padding: number; bullet: number; gap: number; label: Font; title: Font; item: Font }>;
export type CardItem = Readonly<{ bullet: Rectangle; mark: string; text: TextBlock }>;
export type CardDrawing = Readonly<{ panel: Rectangle; label: TextBlock; title: TextBlock; items: readonly CardItem[]; boxes: () => Boxes }>;

const HORIZONTAL: Measures = {
  padding: 56, bullet: 72, gap: 26,
  label: Font.of({ family: 'text', size: 28, lineHeight: 1.2, maximumLines: 1 }),
  title: Font.of({ family: 'text', size: 64, lineHeight: 1.1, maximumLines: 2 }),
  item: Font.of({ family: 'text', size: 46, lineHeight: 1.2, maximumLines: 2 }),
};
const VERTICAL: Measures = {
  padding: 44, bullet: 60, gap: 22,
  label: Font.of({ family: 'text', size: 28, lineHeight: 1.2, maximumLines: 1 }),
  title: Font.of({ family: 'text', size: 56, lineHeight: 1.1, maximumLines: 3 }),
  item: Font.of({ family: 'text', size: 40, lineHeight: 1.2, maximumLines: 3 }),
};
// The pill around the label adds this much around its line (the view draws it with the same padding).
export const PILL_PADDING = { x: 26, y: 10 } as const;
const LABELS: Readonly<Record<Variant, keyof FixedTexts>> = {
  objective: 'objective', summary: 'summary', challenge: 'challenge', next: 'nextLesson', ticket: 'ticket', rule: 'rule',
};
const MARKS: Readonly<Record<Variant, (index: number) => string>> = {
  objective: () => '◎', summary: (index) => String(index + 1), challenge: (index) => String(index + 1),
  next: () => '→', ticket: () => '+', rule: () => '§',
};

type Column = Readonly<{ x: number; width: number }>;

function itemAt(text: string, top: number, context: { index: number; column: Column; measures: Measures }): CardItem {
  const { index, column, measures } = context;
  const textColumn = { x: column.x + measures.bullet + measures.gap, width: column.width - measures.bullet - measures.gap };
  const block = TextBlock.at(`cartão (item ${index + 1})`, { ...textColumn, y: top }, { text, font: measures.item });
  const centered = block.movedDown(Math.max(0, (measures.bullet - block.rectangle.height) / 2));
  return { bullet: { x: column.x, y: top, width: measures.bullet, height: measures.bullet }, mark: '', text: centered };
}

function itemsBelow(scene: CardScene, top: number, context: Readonly<{ column: Column; measures: Measures }>): CardItem[] {
  const { column, measures } = context;
  return scene.items.reduce<CardItem[]>((items, text, index) => {
    const previous = items.at(-1);
    const y = previous ? Math.max(previous.bullet.y + measures.bullet, previous.text.bottom()) + measures.gap : top;
    return [...items, { ...itemAt(text, y, { index, column, measures }), mark: MARKS[scene.variant](index) }];
  }, []);
}

// Items that run past the bottom of the panel shrink with their bullets (down to 60%, like `TextFit`); past that, the check
// reports them with a box on the panel's bottom edge (no area: it only carries the error, it overlaps nothing).
const ITEM_SCALES = [1, 0.9, 0.8, 0.7, 0.6];
const OVERFLOW_LABEL = 'lista de itens do cartão';

function scaled(measures: Measures, scale: number): Measures {
  const { item } = measures;
  const font = Font.of({ family: 'text', size: item.baseSize() * scale, lineHeight: item.lineHeight(), maximumLines: item.maximumLines() });
  return { ...measures, bullet: measures.bullet * scale, gap: measures.gap * scale, item: font };
}

const bottomOf = (items: readonly CardItem[]): number => Math.max(...items.map((item) => Math.max(item.bullet.y + item.bullet.height, item.text.bottom())));

type ItemsPlace = Readonly<{ top: number; bottom: number; column: Column; measures: Measures }>;

function fittedItems(scene: CardScene, place: ItemsPlace): Readonly<{ items: CardItem[]; fits: boolean }> {
  const attempts = ITEM_SCALES.map((scale) => itemsBelow(scene, place.top, { column: place.column, measures: scaled(place.measures, scale) }));
  const fitting = attempts.find((items) => items.length === 0 || bottomOf(items) <= place.bottom);
  return { items: fitting ?? attempts.at(-1)!, fits: fitting !== undefined };
}

/** The card (objective, summary, challenge, next, ticket, rule): label pill, title and the items with their bullets. */
export class CardLayout {
  static for(scene: CardScene, aspect: AspectRatio, language: Language): CardDrawing {
    const panel = LessonStage.for(aspect).content();
    const measures = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const column = { x: panel.x + measures.padding, width: panel.width - 2 * measures.padding };
    const labelText = fixedTexts(language)[LABELS[scene.variant]].toUpperCase();
    const pill = { x: column.x + PILL_PADDING.x, y: panel.y + measures.padding + PILL_PADDING.y, width: column.width - 2 * PILL_PADDING.x };
    const label = TextBlock.at('cartão (rótulo)', pill, { text: labelText, font: measures.label });
    const title = TextBlock.at('cartão (título)', { ...column, y: label.bottom() + PILL_PADDING.y + 28 }, { text: scene.title, font: measures.title });
    const bottom = panel.y + panel.height - measures.padding;
    const { items, fits } = fittedItems(scene, { top: title.bottom() + 36, bottom, column, measures });
    const edge = Box.fitted(OVERFLOW_LABEL, { x: panel.x, y: bottom, width: 0, height: 0 }, { fits });
    const blocks = [label, title, ...items.map((item) => item.text)];
    return { panel, label, title, items, boxes: () => Boxes.of([...blocks.map((block) => block.box()), edge]) };
  }

  /** The first `shown` items (every one when the scene does not say), the newest popping in. */
  static reveal(scene: CardScene): Reveal {
    return Reveal.of({ shown: scene.shown ?? scene.items.length, animatesNewest: true });
  }
}
