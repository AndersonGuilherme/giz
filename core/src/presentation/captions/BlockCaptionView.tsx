import type { FC } from 'react';
import { CAPTION_LAYOUTS } from '../../domain/caption/captionLayouts.ts';
import { captionWords } from '../../domain/caption/captionWords.ts';
import { TEXT_FONT } from '../scenes/fonts.ts';
import type { CaptionProps } from './captionProps.ts';

const LAYOUT = CAPTION_LAYOUTS.blocks;
// The motor's lesson caption: white text in a dark violet pill.
const PILL = { background: 'rgba(29, 21, 48, 0.86)', color: '#ffffff', radius: 18 } as const;

/** The block caption: the block on screen and its lines come from the domain; this only draws them. */
export const BlockCaptionView: FC<CaptionProps> = ({ words, lineDuration, aspect, format, frame }) => {
  const text = LAYOUT.caption(captionWords(words, lineDuration)).blockAt(frame);
  if (!text) return null;
  const { fit, font } = LAYOUT.pill(text, aspect, format);
  const rectangle = LAYOUT.rectangle(aspect, format);
  const { padding } = LAYOUT;
  return (
    <div style={{ position: 'absolute', left: rectangle.x, top: rectangle.y, width: rectangle.width, height: rectangle.height, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        style={{
          background: PILL.background, color: PILL.color, borderRadius: PILL.radius, padding: `${padding.y}px ${padding.x}px`,
          fontFamily: TEXT_FONT, fontWeight: 700, fontSize: fit.size, lineHeight: font.lineHeight(), textAlign: 'center', whiteSpace: 'pre',
        }}
      >
        {fit.lines.map((line, index) => <div key={index}>{line}</div>)}
      </div>
    </div>
  );
};
