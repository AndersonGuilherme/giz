import { BackgroundStill } from 'giz-core/src/presentation/studio/index.ts';
import type { SceneBackground } from '../../../shared/scenarios.ts';
import { useTranslate } from '../../i18n.ts';

type Props = Readonly<{ background: SceneBackground; aspect: '9:16' | '16:9'; width: number }>;

/** What the scene shows now, as a thumbnail: a vector background drawn by core, or the picture itself. */
export function SceneThumb({ background, aspect, width }: Props) {
  const translate = useTranslate();
  const height = aspect === '9:16' ? (width * 16) / 9 : (width * 9) / 16;
  if (background.kind === 'vector') return <div className="scene-thumb" style={{ width, height }}><BackgroundStill vector={background.vector as never} aspect={aspect} width={width} colors={background.colors} /></div>;
  if (!background.url) return <div className="scene-thumb missing" style={{ width, height }}>{translate('scenarios.imageMissing')}</div>;
  return <img className="scene-thumb" src={background.url} alt="" style={{ width, height }} />;
}
