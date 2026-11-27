import type { FC } from 'react';
import { Img } from 'remotion';
import type { Framing } from '../../../domain/camera/Framing.ts';
import { BackdropLayout } from '../../../domain/scenario/BackdropLayout.ts';
import { BackgroundPalette } from '../../../domain/scenario/BackgroundPalette.ts';
import type { BackgroundChoice } from '../../../domain/scenario/BackgroundSource.ts';
import { Parallax, type Layer } from '../../../domain/scenario/Parallax.ts';
import { IMAGE_BLEED } from '../../../domain/scenario/ScenarioImageFrame.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import { useMediaSource } from '../../remotion/mediaSource.ts';
import { backgroundRegistry } from './backgrounds/backgroundRegistry.ts';
import { LayerCanvas } from './backgrounds/LayerCanvas.tsx';
import type { LayerProps, VectorBackgroundModel } from './backgrounds/VectorBackgroundModel.ts';
import { CameraPlane } from './CameraPlane.tsx';

/** `behind` draws the back and middle layers (before the characters); `front`, the foreground over them. */
export type BackgroundPart = 'behind' | 'front';
const PART_LAYERS: Readonly<Record<BackgroundPart, readonly Layer[]>> = { behind: [0, 1], front: [2] };

type ViewProps = Readonly<{ choice: BackgroundChoice; camera: Framing; aspect: AspectRatio; part: BackgroundPart; onImageError: () => void }>;

// The image is 12% larger than the frame (6% each side), so the camera can move without showing its edge.
const [BLEED, COVER] = [`-${IMAGE_BLEED * 100}%`, `${100 + 2 * IMAGE_BLEED * 100}%`];

const ImageBackground: FC<Readonly<{ image: string; camera: Framing; onImageError: () => void }>> = ({ image, camera, onImageError }) => {
  const source = useMediaSource();
  return (
    <CameraPlane framing={camera}>
      <Img
        src={source(image)}
        onError={onImageError}
        style={{ position: 'absolute', left: BLEED, top: BLEED, width: COVER, height: COVER, objectFit: 'cover' }}
      />
    </CameraPlane>
  );
};

function layerPropsFor(choice: Extract<BackgroundChoice, { kind: 'vector' }>, aspect: AspectRatio): LayerProps {
  const [width, height] = [aspect.width(), aspect.height()];
  const colors = BackgroundPalette.with(choice.vector, choice.colors);
  const backdrop = BackdropLayout.for(aspect);
  return { colors, width, height, ground: backdrop.ground, unit: backdrop.unit, backdrop };
}

/** The scenario background: an image (behind only) or the layers of a vector background, each with its parallax. */
export const BackgroundView: FC<ViewProps> = ({ choice, camera, aspect, part, onImageError }) => {
  if (choice.kind === 'image') return part === 'behind' ? <ImageBackground image={choice.image} camera={camera} onImageError={onImageError} /> : null;
  // The layers get the full palette of this same background (`BackgroundPalette.with`), so they may be widened to any palette.
  const model = backgroundRegistry[choice.vector] as VectorBackgroundModel;
  const props = layerPropsFor(choice, aspect);
  return (
    <>
      {PART_LAYERS[part].map((layer) => {
        const Drawing = model.layers[layer];
        return (
          <CameraPlane key={layer} framing={Parallax.offset(layer, camera)}>
            <LayerCanvas width={props.width} height={props.height}><Drawing {...props} /></LayerCanvas>
          </CameraPlane>
        );
      })}
    </>
  );
};
