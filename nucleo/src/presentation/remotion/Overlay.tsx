import type { FC } from 'react';
import type { OverlayDrawing } from '../../domain/video/OverlayLayout.ts';
import { FittedText } from '../scenes/lesson/FittedText.tsx';
import { THEME } from '../scenes/lesson/theme.ts';

/** The brand and chapter frame over the scene, as the motor's lesson header; where each goes comes from `OverlayLayout`. */
export const Overlay: FC<Readonly<{ drawing: OverlayDrawing }>> = ({ drawing }) => (
  <>
    {drawing.brand && (
      <FittedText block={drawing.brand} weight={900} style={{ background: THEME.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }} />
    )}
    {drawing.chapter && <FittedText block={drawing.chapter} weight={900} style={{ color: THEME.brand }} />}
  </>
);
