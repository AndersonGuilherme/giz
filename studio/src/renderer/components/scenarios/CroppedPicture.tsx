import { cropStyle, IMAGE_BLEED } from 'gizzycera-core/src/presentation/studio/index.ts';
import type { ImageCrop } from '../../../shared/scenarios.ts';

const MARGIN = `${-IMAGE_BLEED * 100}%`;
const BOX = `${100 + 2 * IMAGE_BLEED * 100}%`;
/** The frame's place inside the picture box (the box is the frame plus the camera margin on each side), in %. */
export const FRAME_INSET = `${(IMAGE_BLEED / (1 + 2 * IMAGE_BLEED)) * 100}%`;

type Props = Readonly<{ url: string; crop?: ImageCrop; onLoad?: (picture: HTMLImageElement) => void }>;

/** The picture as the render draws it in its box (core's crop style): it fills its parent. */
export function PictureBox({ url, crop, onLoad }: Props) {
  return (
    <div className="picture-box">
      <img src={url} alt="" draggable={false} style={cropStyle(crop)} onLoad={(event) => onLoad?.(event.currentTarget)} />
    </div>
  );
}

/** What the frame shows of the picture (the box without the camera margin), as the render shows it. */
export function FramedPicture({ url, crop }: Props) {
  return (
    <div className="framed-picture">
      <div style={{ position: 'absolute', left: MARGIN, top: MARGIN, width: BOX, height: BOX }}><PictureBox url={url} crop={crop} /></div>
    </div>
  );
}
