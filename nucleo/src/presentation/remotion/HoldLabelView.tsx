import type { FC } from 'react';
import type { HoldDrawing } from '../../domain/video/HoldLabel.ts';
import { TEXT_FONT } from '../scenes/fonts.ts';
import { FittedText } from '../scenes/lesson/FittedText.tsx';
import { placed, THEME } from '../scenes/lesson/theme.ts';

type HoldLabelViewProps = Readonly<{ drawing: HoldDrawing; secondsLeft: number }>;

/** The hold card, as in the motor: dark pill, gradient badge with the seconds left, white label; places come from `HoldLabel`. */
export const HoldLabelView: FC<HoldLabelViewProps> = ({ drawing, secondsLeft }) => {
  const { pill, badge, digitSize, label } = drawing;
  return (
    <>
      <div style={{ ...placed(pill), borderRadius: 28, background: THEME.ink, boxShadow: THEME.shadow }} />
      <div
        style={{
          ...placed(badge), borderRadius: badge.width / 2, background: THEME.gradient, color: '#ffffff', display: 'grid', placeItems: 'center',
          fontFamily: TEXT_FONT, fontWeight: 900, fontSize: digitSize,
        }}
      >
        {secondsLeft}
      </div>
      <FittedText block={label} weight={800} style={{ color: '#ffffff' }} />
    </>
  );
};
