import type { CSSProperties } from 'react';
import type { Rectangle } from '../../../domain/layout/Box.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';

// The lesson palette of the old motor (`motor/src/theme.ts`).
export const THEME = {
  background: 'linear-gradient(150deg, #F7F1FF 0%, #FBEFFF 55%, #FFF4FB 100%)',
  gradient: 'linear-gradient(100deg, #E817DF 0%, #7B2FF2 100%)',
  brand: '#7B2FF2',
  magenta: '#E817DF',
  ink: '#1D1530',
  muted: '#6B6280',
  line: '#E6DEFA',
  card: '#FFFFFF',
  ok: '#16A34A',
  danger: '#E5484D',
  teal: '#0EA5A4',
  amber: '#B45309',
  shadow: '0 24px 60px rgba(61, 20, 140, .14)',
} as const;

/** Absolute position and size of a rectangle in video pixels. */
export const placed = (rectangle: Rectangle): CSSProperties => ({
  position: 'absolute', left: rectangle.x, top: rectangle.y, width: rectangle.width, height: rectangle.height, boxSizing: 'border-box',
});

/** The motor's `fadeUp` as a style. */
export function fadeUp(progress: number): CSSProperties {
  const { opacity, shift } = Motion.fadeUp(progress);
  return { opacity, transform: `translateY(${shift}px)` };
}
