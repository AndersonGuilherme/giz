import type { CSSProperties, FC } from 'react';
import type { TextBlock } from '../../../domain/lesson/TextBlock.ts';
import { TEXT_FONT } from '../fonts.ts';
import { placed } from './theme.ts';

type FittedTextProps = Readonly<{ block: TextBlock; weight?: number; style?: CSSProperties }>;

/** Draws the lines `TextFit` chose, one per row, at the size it chose: the video wraps exactly like the check. */
export const FittedText: FC<FittedTextProps> = ({ block, weight = 800, style }) => (
  <div style={{ ...placed(block.rectangle), height: undefined, fontFamily: TEXT_FONT, fontWeight: weight, fontSize: block.fit.size, lineHeight: block.content.font.lineHeight(), whiteSpace: 'pre', ...style }}>
    {block.fit.lines.map((line, index) => <div key={index}>{line}</div>)}
  </div>
);
