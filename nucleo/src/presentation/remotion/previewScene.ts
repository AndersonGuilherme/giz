import type { CaptionStyle, Format } from '../../domain/project/Project.ts';
import type { Scene } from '../../domain/script/Scene.ts';
import type { AspectRatioText } from '../../domain/values/AspectRatio.ts';
import type { CastMember } from '../scenes/SceneRegistry.ts';
import type { PreviewState } from './previewState.ts';

export type ScenePreviewProps = Readonly<{
  scene: Scene;
  aspect: AspectRatioText;
  language?: 'pt-BR' | 'en';
  frames: number;
  cast: readonly CastMember[];
  states: Readonly<Record<string, PreviewState>>;
  /** A line said over the whole preview, with the caption `style` (or the default of `format`); words spread by letters, no audio. */
  caption?: Readonly<{ text: string; format: Format; style?: CaptionStyle }>;
}>;

// The test scene: two friends in the village on the third day without internet, one explaining, one unconvinced.
export const PREVIEW_DEFAULTS: ScenePreviewProps = {
  aspect: '16:9',
  frames: 91,
  scene: {
    type: 'scenario',
    background: { vector: 'village' },
    characters: [
      { character: 'ana', position: 'left' },
      { character: 'beto', position: 'right' },
    ],
    camera: { type: 'zoom-in', to: { zoom: 1.12, x: 0, y: 0 }, easing: 'smooth' },
    effects: [{ type: 'particles', intensity: 0.4 }, { type: 'vignette', intensity: 0.5 }],
    hud: {
      fields: [{ label: 'DIA', value: '3' }, { label: 'SEM', value: 'WI-FI' }],
      bar: { label: 'PACIÊNCIA', value: 40 },
    },
  },
  cast: [
    { id: 'ana', rig: 'giz', parameters: { skin: 'brown', headShape: 'bean', eyeColor: '#4c9a5a', hair: 'bun', hairColor: '#1f1410', outfit: 'hoodie', outfitColor: '#e8735a', accessoryColor: '#f6e7c8' } },
    { id: 'beto', rig: 'giz', parameters: { skin: 'fair', headShape: 'soft-square', eyeColor: '#3f7fc4', hairColor: '#b4532a', freckles: true, glasses: true, outfitColor: '#3d6fb0', accessoryColor: '#f2b134' } },
  ],
  states: { ana: { expression: 'happy', pose: 'explain' }, beto: { expression: 'skeptical', pose: 'think' } },
};
