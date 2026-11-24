import type { CSSProperties, FC, ReactNode } from 'react';
import type { Rectangle } from '../../../domain/layout/Box.ts';
import { placed, THEME } from './theme.ts';

/** The white rounded card most lesson scenes sit on. */
export const Panel: FC<Readonly<{ rectangle: Rectangle; style?: CSSProperties; children?: ReactNode }>> = ({ rectangle, style, children }) => (
  <div style={{ ...placed(rectangle), background: THEME.card, borderRadius: 36, boxShadow: THEME.shadow, ...style }}>{children}</div>
);
