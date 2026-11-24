import type { FC, ReactNode } from 'react';

// Each layer is drawn 6% past every edge: a shaking or rotating camera never shows the end of the drawing.
const BLEED = 0.06;

type CanvasProps = Readonly<{ width: number; height: number; children: ReactNode }>;

/** An SVG in video pixels (0,0 at the top left of the frame) that also covers the bleed around the frame. */
export const LayerCanvas: FC<CanvasProps> = ({ width, height, children }) => {
  const [left, top] = [-width * BLEED, -height * BLEED];
  const [fullWidth, fullHeight] = [width * (1 + 2 * BLEED), height * (1 + 2 * BLEED)];
  return (
    <svg
      width={fullWidth}
      height={fullHeight}
      viewBox={`${left} ${top} ${fullWidth} ${fullHeight}`}
      style={{ position: 'absolute', left, top }}
    >
      {children}
    </svg>
  );
};
