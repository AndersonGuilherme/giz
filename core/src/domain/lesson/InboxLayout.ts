import type { Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { fixedTexts } from '../i18n/fixedTexts.ts';
import type { InboxScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Language } from '../values/Language.ts';
import type { Fps } from '../values/Time.ts';
import { LessonStage } from './LessonStage.ts';
import { Motion } from './Motion.ts';
import { TextBlock } from './TextBlock.ts';

export type InboxRow = Readonly<{ rectangle: Rectangle; avatar: Rectangle; subject: TextBlock; sender: TextBlock }>;
export type InboxDrawing = Readonly<{
  card: Rectangle; title: TextBlock; badge: Rectangle; count: TextBlock; note?: TextBlock; rows: readonly InboxRow[]; boxes: () => Boxes;
}>;

// The motor's inbox: a 760 px card centered on the content, a header (title and counter badge) and five message rows.
const CARD_WIDTH = 760;
const PADDING = 44;
const HEADER_GAP = 28;
const BADGE = { width: 200, padding: { x: 26, y: 10 } } as const;
const ROW = { padding: 18, border: 2, avatar: 54, gap: 20, count: 5 } as const;
// The note is a pill 26 px above the card, 44 px from its left edge.
export const NOTE_PILL = { rise: 26, padding: { x: 20, y: 8 } } as const;
const font = (size: number) => Font.of({ family: 'text', size, lineHeight: 1.2, maximumLines: 1 });
const FONTS = { title: font(46), count: font(44), subject: Font.of({ family: 'text', size: 32, lineHeight: 1.2, maximumLines: 2 }), sender: font(26), note: font(22) } as const;
// The counter climbs to `count` in 2.2 s (accelerating); every 600 messages fill one more row, up to five.
const CLIMB_SECONDS = 2.2;
const MESSAGES_PER_ROW = 600;
const PULSE = 0.08;

type Column = Readonly<{ x: number; width: number }>;
type RowContext = Readonly<{ column: Column; texts: Readonly<{ subject: string; sender: string }> }>;
type RowPlace = Readonly<{ index: number; y: number; height: number }>;

const lineOf = (size: number) => size * 1.2;
const HEADER_HEIGHT = lineOf(44) + 2 * BADGE.padding.y;
const ROW_FRAME = ROW.border + 2 * ROW.padding;
// A row without a message keeps one blank line; a filled one is as tall as its subject (up to two lines) and sender.
const EMPTY_ROW_HEIGHT = ROW_FRAME + Math.max(ROW.avatar, lineOf(32) + lineOf(26));

const textColumnOf = (column: Column) => ({ x: column.x + ROW.avatar + ROW.gap, width: column.width - ROW.avatar - ROW.gap });

function rowAt(place: RowPlace, context: RowContext): InboxRow {
  const { column, texts } = context;
  const { index, y, height } = place;
  const inner = y + ROW.border + ROW.padding;
  const subject = TextBlock.at(`caixa de entrada (assunto ${index + 1})`, { ...textColumnOf(column), y: inner }, { text: texts.subject, font: FONTS.subject });
  const sender = TextBlock.at(`caixa de entrada (remetente ${index + 1})`, { ...textColumnOf(column), y: subject.bottom() }, { text: texts.sender, font: FONTS.sender });
  const avatarTop = inner + (height - ROW_FRAME - ROW.avatar) / 2;
  return { rectangle: { ...column, y, height }, avatar: { x: column.x, y: avatarTop, width: ROW.avatar, height: ROW.avatar }, subject, sender };
}

function rowHeights(scene: InboxScene, context: RowContext): number[] {
  const subject = TextBlock.at('', { ...textColumnOf(context.column), y: 0 }, { text: scene.subject, font: FONTS.subject });
  const filledHeight = ROW_FRAME + Math.max(ROW.avatar, subject.rectangle.height + lineOf(26));
  const filled = InboxLayout.filledRows(scene.count);
  return Array.from({ length: ROW.count }, (_empty, index) => (index < filled ? filledHeight : EMPTY_ROW_HEIGHT));
}

function rowsBelow(top: number, heights: readonly number[], context: RowContext): InboxRow[] {
  return heights.reduce<InboxRow[]>((rows, height, index) => {
    const previous = rows.at(-1)?.rectangle;
    const y = previous ? previous.y + previous.height : top;
    return [...rows, rowAt({ index, y, height }, context)];
  }, []);
}

// Centered on the content area, with the note pill (when there is one) inside it too.
function cardIn(content: Rectangle, scene: InboxScene, rows: number): Rectangle {
  const width = Math.min(CARD_WIDTH, content.width);
  const height = 2 * PADDING + HEADER_HEIGHT + HEADER_GAP + rows;
  const rise = scene.note ? NOTE_PILL.rise : 0;
  const y = content.y + rise + Math.max(0, (content.height - height - rise) / 2);
  return { x: content.x + (content.width - width) / 2, y, width, height };
}

function noteOf(scene: InboxScene, card: Rectangle): TextBlock | undefined {
  if (!scene.note) return undefined;
  const { padding } = NOTE_PILL;
  const place = { x: card.x + PADDING + padding.x, y: card.y - NOTE_PILL.rise + padding.y, width: card.width - 2 * PADDING - 2 * padding.x };
  return TextBlock.at('caixa de entrada (nota)', place, { text: scene.note, font: FONTS.note });
}

/** The inbox flooded by one message repeated: its counter climbs and the rows fill up. */
export class InboxLayout {
  static for(scene: InboxScene, aspect: AspectRatio, language: Language): InboxDrawing {
    const content = LessonStage.for(aspect).content();
    const texts = fixedTexts(language);
    const width = Math.min(CARD_WIDTH, content.width);
    const context = { column: { x: content.x + (content.width - width) / 2 + PADDING, width: width - 2 * PADDING }, texts: { subject: scene.subject, sender: texts.inboxSender } };
    const heights = rowHeights(scene, context);
    const card = cardIn(content, scene, heights.reduce((sum, height) => sum + height, 0));
    const { column } = context;
    const badge = { x: column.x + column.width - BADGE.width, y: card.y + PADDING, width: BADGE.width, height: HEADER_HEIGHT };
    const count = TextBlock.at('caixa de entrada (contador)', { x: badge.x + BADGE.padding.x, y: badge.y + BADGE.padding.y, width: BADGE.width - 2 * BADGE.padding.x }, { text: InboxLayout.countText(scene.count, language), font: FONTS.count });
    const title = TextBlock.at('caixa de entrada (título)', { x: column.x, y: card.y + PADDING + (HEADER_HEIGHT - lineOf(46)) / 2, width: column.width - BADGE.width - ROW.gap }, { text: texts.inbox, font: FONTS.title });
    const rows = rowsBelow(card.y + PADDING + HEADER_HEIGHT + HEADER_GAP, heights, context);
    const note = noteOf(scene, card);
    const filled = rows.slice(0, InboxLayout.filledRows(scene.count)).flatMap((row) => [row.subject, row.sender]);
    const blocks = [title, count, ...(note ? [note] : []), ...filled];
    return { card, title, badge, count, note, rows, boxes: () => Boxes.of(blocks.map((block) => block.box())) };
  }

  /** The counter `age` frames after the last change: from 0 to `count` in 2.2 s, accelerating. */
  static countAt(scene: InboxScene, age: number, fps: Fps): number {
    const climbed = Motion.ramp(age, [0, CLIMB_SECONDS * fps.value()]);
    return Math.round(scene.count * climbed * climbed);
  }

  static filledRows(shown: number): number {
    return Math.min(ROW.count, Math.ceil(shown / MESSAGES_PER_ROW));
  }

  /** The badge throbs while the counter climbs. */
  static badgeScale(scene: InboxScene, shown: number, age: number): number {
    const climbing = shown > 0 && shown < scene.count;
    return 1 + (climbing ? PULSE * Math.sin(age) : 0);
  }

  static countText(count: number, language: Language): string {
    return count.toLocaleString(language.code());
  }
}
