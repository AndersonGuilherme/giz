import type { FC } from 'react';
import type { Format } from '../../domain/project/Project.ts';
import { BlockCaptionView } from './BlockCaptionView.tsx';
import type { CaptionProps } from './captionProps.ts';
import { WordCaptionView } from './WordCaptionView.tsx';

/** The caption component of each format; each one draws with `CAPTION_LAYOUTS[format]`, the layout the `check` uses. */
export const CAPTION_VIEWS: Readonly<Record<Format, FC<CaptionProps>>> = { story: WordCaptionView, lesson: BlockCaptionView };
