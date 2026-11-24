import type { FC } from 'react';
import { CAPTION_LAYOUTS } from '../../domain/caption/captionLayouts.ts';
import { captionWords } from '../../domain/caption/captionWords.ts';
import { ACTIVE_WORD_SCALE, activeWordMargin, WORD_CAPTION_FONT } from '../../domain/caption/WordCaption.ts';
import { TEXT_FONT } from '../scenes/fonts.ts';
import type { CaptionProps } from './captionProps.ts';

const LAYOUT = CAPTION_LAYOUTS.words;
// White heavy capitals with a dark outline and shadow, so they read over any scene; the spoken word in a warm yellow.
const COLORS = { text: '#ffffff', active: '#ffc93c', outline: '#120b07' } as const;
const SHADOW = '0 0 2px #120b07, 0 5px 0 rgba(18, 11, 7, 0.6), 0 0 22px rgba(0, 0, 0, 0.6)';

const Word: FC<Readonly<{ text: string; active: boolean; size: number }>> = ({ text, active, size }) => (
  <span
    style={{
      display: 'inline-block', color: active ? COLORS.active : COLORS.text, transform: `scale(${active ? ACTIVE_WORD_SCALE : 1})`,
      // The scale does not move the neighbours: the grown word gets the room it takes on each side.
      margin: `0 ${active ? activeWordMargin(text) : 0}em`,
      WebkitTextStroke: `${Math.max(2, Math.round(size / 14))}px ${COLORS.outline}`, paintOrder: 'stroke fill', textShadow: SHADOW,
    }}
  >
    {text}
  </span>
);

/** The word-by-word caption: the group and the active word come from `WordCaption`; this only draws them. */
export const WordCaptionView: FC<CaptionProps> = ({ words, lineDuration, aspect, format, frame }) => {
  const caption = LAYOUT.caption(captionWords(words, lineDuration), aspect, format);
  const group = caption.groupAt(frame);
  const size = caption.sizeAt(frame);
  const rectangle = LAYOUT.rectangle(aspect, format);
  return (
    <div
      style={{
        position: 'absolute', left: rectangle.x, top: rectangle.y, width: rectangle.width, height: rectangle.height,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.32em', whiteSpace: 'nowrap',
        fontFamily: TEXT_FONT, fontWeight: 900, fontSize: size, lineHeight: WORD_CAPTION_FONT.lineHeight(), textTransform: 'uppercase',
      }}
    >
      {group.words.map((text, index) => <Word key={`${index}-${text}`} text={text} active={index === group.active} size={size} />)}
    </div>
  );
};
