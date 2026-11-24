import type { FC } from 'react';
import { Img, staticFile } from 'remotion';
import type { Framing } from '../../../domain/camera/Framing.ts';
import type { BackgroundChoice } from '../../../domain/scenario/BackgroundSource.ts';
import { Parallax, type Layer } from '../../../domain/scenario/Parallax.ts';
import { Placement } from '../../../domain/scenario/Placement.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import { backgroundRegistry } from './backgrounds/backgroundRegistry.ts';
import { LayerCanvas } from './backgrounds/LayerCanvas.tsx';
import type { LayerProps } from './backgrounds/VectorBackgroundModel.ts';
import { CameraPlane } from './CameraPlane.tsx';

/** `behind` draws the back and middle layers (before the characters); `front`, the foreground over them. */
export type BackgroundPart = 'behind' | 'front';
const PART_LAYERS: Readonly<Record<BackgroundPart, readonly Layer[]>> = { behind: [0, 1], front: [2] };

type ViewProps = Readonly<{ choice: BackgroundChoice; camera: Framing; aspect: AspectRatio; part: BackgroundPart; onImageError: () => void }>;

// The image is 12% larger than the frame (6% each side), so the camera can move without showing its edge.
const ImageBackground: FC<Readonly<{ image: string; camera: Framing; onImageError: () => void }>> = ({ image, camera, onImageError }) => (
  <CameraPlane framing={camera}>
    <Img
      src={staticFile(image)}
      onError={onImageError}
      style={{ position: 'absolute', left: '-6%', top: '-6%', width: '112%', height: '112%', objectFit: 'cover' }}
    />
  </CameraPlane>
);

function layerPropsFor(choice: Extract<BackgroundChoice, { kind: 'vector' }>, aspect: AspectRatio): LayerProps {
  const [width, height] = [aspect.width(), aspect.height()];
  const colors = { ...backgroundRegistry[choice.vector].palette, ...choice.colors };
  return { colors, width, height, ground: Placement.groundOf(aspect), unit: Math.min(width, height) / 1000 };
}

/** The scenario background: an image (behind only) or the layers of a vector background, each with its parallax. */
export const BackgroundView: FC<ViewProps> = ({ choice, camera, aspect, part, onImageError }) => {
  if (choice.kind === 'image') return part === 'behind' ? <ImageBackground image={choice.image} camera={camera} onImageError={onImageError} /> : null;
  const model = backgroundRegistry[choice.vector];
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
