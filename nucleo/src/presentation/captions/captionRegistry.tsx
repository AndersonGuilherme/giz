import type { FC } from 'react';
import { captionStyleOf, type CaptionStyle } from '../../domain/project/Project.ts';
import { BlockCaptionView } from './BlockCaptionView.tsx';
import type { CaptionProps } from './captionProps.ts';
import { WordCaptionView } from './WordCaptionView.tsx';

/** The caption component of each style; each one draws with `CAPTION_LAYOUTS[style]`, the layout the `check` uses. */
export const CAPTION_VIEWS: Readonly<Record<CaptionStyle, FC<CaptionProps>>> = { words: WordCaptionView, blocks: BlockCaptionView };

/** The caption of a video: the declared style, or the default of the format (the same rule as the `check`). */
export const CaptionView: FC<CaptionProps & Readonly<{ style?: CaptionStyle }>> = ({ style, ...props }) => {
  const View = CAPTION_VIEWS[captionStyleOf(props.format, style)];
  return <View {...props} />;
};
