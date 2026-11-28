import { CROP_LIMITS } from 'gizzycera-core/src/presentation/studio/index.ts';
import { useRef, useState, type PointerEvent } from 'react';
import type { ImageCrop, SceneCard } from '../../../shared/scenarios.ts';
import { useTranslate } from '../../i18n.ts';
import { dragged, NO_CROP, zoomed, type CropShape } from '../../scenarios/cropDrag.ts';
import { Modal } from '../common/Modal.tsx';
import { FRAME_INSET, PictureBox } from './CroppedPicture.tsx';

type Props = Readonly<{ card: SceneCard; url: string; aspect: '9:16' | '16:9'; onSave: (crop: ImageCrop | null) => void; onClose: () => void }>;
type Drag = Readonly<{ x: number; y: number; from: ImageCrop }>;

const BOX_WIDTH = { '9:16': 270, '16:9': 560 } as const;

// Dragging moves the picture under the frame: the crop follows the pointer from where the drag began.
function useDragging(crop: ImageCrop, setCrop: (crop: ImageCrop) => void, shape: () => CropShape | undefined) {
  const start = useRef<Drag | null>(null);
  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      start.current = { x: event.clientX, y: event.clientY, from: crop };
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const [begun, known] = [start.current, shape()];
      if (begun && known) setCrop(dragged(begun.from, { dx: event.clientX - begun.x, dy: event.clientY - begun.y }, known));
    },
    onPointerUp: () => void (start.current = null),
    onPointerCancel: () => void (start.current = null),
    onLostPointerCapture: () => void (start.current = null),
  };
}

function Stage({ url, aspect, crop, setCrop }: Readonly<{ url: string; aspect: Props['aspect']; crop: ImageCrop; setCrop: (crop: ImageCrop) => void }>) {
  const picture = useRef<HTMLImageElement | null>(null);
  const width = BOX_WIDTH[aspect];
  const height = aspect === '9:16' ? (width * 16) / 9 : (width * 9) / 16;
  const shape = () => picture.current && { box: { width, height }, picture: { width: picture.current.naturalWidth, height: picture.current.naturalHeight }, limits: CROP_LIMITS };
  const drag = useDragging(crop, setCrop, () => shape() ?? undefined);
  return (
    <div className="crop-stage" style={{ width, height }} data-testid="crop-stage" onWheel={(event) => setCrop(zoomed(crop, crop.zoom - event.deltaY / 500, CROP_LIMITS))} {...drag}>
      <PictureBox url={url} crop={crop} onLoad={(image) => void (picture.current = image)} />
      <div className="crop-frame" style={{ inset: FRAME_INSET }} aria-hidden="true" />
    </div>
  );
}

/** "Recortar enquadramento": the person drags and zooms the picture under the video's frame; the file is never changed. */
export function CropDialog({ card, url, aspect, onSave, onClose }: Props) {
  const translate = useTranslate();
  const [crop, setCrop] = useState<ImageCrop>((card.background.kind === 'image' && card.background.crop) || NO_CROP);
  return (
    <Modal title={translate('scenarios.cropTitle', { number: card.number })} testId="crop-dialog">
      <p className="muted small">{translate('scenarios.cropHint')}</p>
      <Stage url={url} aspect={aspect} crop={crop} setCrop={setCrop} />
      <label className="field crop-zoom">
        <span className="field-label">{translate('scenarios.cropZoom')}</span>
        <input type="range" min={CROP_LIMITS.zoom.least} max={CROP_LIMITS.zoom.most} step={0.01} value={crop.zoom} data-testid="crop-zoom" onChange={(event) => setCrop(zoomed(crop, Number(event.target.value), CROP_LIMITS))} />
      </label>
      <div className="dialog-actions">
        <button type="button" className="chalk-button quiet" data-testid="crop-cancel" onClick={onClose}>{translate('common.cancel')}</button>
        <button type="button" className="chalk-button" data-testid="crop-reset" onClick={() => onSave(null)}>{translate('scenarios.cropReset')}</button>
        <button type="button" className="chalk-button primary" data-testid="crop-save" onClick={() => onSave(crop)}>{translate('scenarios.cropSave')}</button>
      </div>
    </Modal>
  );
}
