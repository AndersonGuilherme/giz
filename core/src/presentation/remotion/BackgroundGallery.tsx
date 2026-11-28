import type { FC } from 'react';
import { AbsoluteFill, type CalculateMetadataFunction } from 'remotion';
import { Framing } from '../../domain/camera/Framing.ts';
import { GalleryGrid } from '../../domain/layout/GalleryGrid.ts';
import { VECTOR_BACKGROUNDS, type VectorBackground } from '../../domain/scenario/BackgroundSource.ts';
import { AspectRatio, type AspectRatioText } from '../../domain/values/AspectRatio.ts';
import { BackgroundView } from '../scenes/scenario/BackgroundView.tsx';
import { BOARD, FONT, INK } from './sheetParts.tsx';

/** `aspect` is both the sheet's size and the thumbnails' (one sheet for 16:9, one for 9:16). */
export type BackgroundGalleryProps = Readonly<{ aspect: AspectRatioText }>;

export const backgroundGalleryMetadata: CalculateMetadataFunction<BackgroundGalleryProps> = ({ props }) => {
  const aspect = AspectRatio.of(props.aspect);
  return { width: aspect.width(), height: aspect.height() };
};

const MARGIN = { side: 32, top: 92, bottom: 24 };
const GAP = 16;
const LABEL = 30;
const MUTED = '#a9c2b8';
const NEUTRAL = Framing.neutral();
const ignoreImageError = () => undefined;

type Size = Readonly<{ width: number; height: number }>;

// One background at full size, shrunk into the card: every layer, with no camera move and no characters.
const Thumbnail: FC<Readonly<{ name: VectorBackground; aspect: AspectRatio; card: Size }>> = ({ name, aspect, card }) => {
  const fit = GalleryGrid.contain({ width: aspect.width(), height: aspect.height() }, { width: card.width, height: card.height - LABEL });
  const choice = { kind: 'vector', vector: name, colors: {} } as const;
  const view = { choice, camera: NEUTRAL, aspect, onImageError: ignoreImageError };
  return (
    <div style={{ width: card.width, height: card.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: fit.width, height: fit.height, position: 'relative', overflow: 'hidden', borderRadius: 12, boxShadow: '0 3px 8px rgba(0,0,0,0.35)' }}>
        <div style={{ width: aspect.width(), height: aspect.height(), position: 'absolute', transform: `scale(${fit.scale})`, transformOrigin: '0 0' }}>
          <BackgroundView {...view} part="behind" />
          <BackgroundView {...view} part="front" />
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 20, color: INK, height: LABEL, lineHeight: `${LABEL}px`, whiteSpace: 'nowrap' }}>{name}</div>
    </div>
  );
};

/** Every vector background as a labeled thumbnail, for checking them by eye in 16:9 or in 9:16. */
export const BackgroundGallery: FC<BackgroundGalleryProps> = (props) => {
  const aspect = AspectRatio.of(props.aspect);
  const area = { width: aspect.width() - 2 * MARGIN.side, height: aspect.height() - MARGIN.top - MARGIN.bottom };
  const { columns, card } = GalleryGrid.for(VECTOR_BACKGROUNDS.length, area, GAP);
  return (
    <AbsoluteFill style={{ background: BOARD, padding: `24px ${MARGIN.side}px ${MARGIN.bottom}px` }}>
      <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, height: MARGIN.top - 24 }}>
        Gizzycera <span style={{ fontWeight: 400, color: MUTED }}>· fundos vetoriais · {props.aspect}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, ${card.width}px)`, gap: GAP }}>
        {VECTOR_BACKGROUNDS.map((name) => <Thumbnail key={name} name={name} aspect={aspect} card={card} />)}
      </div>
    </AbsoluteFill>
  );
};
