import type { ScenarioScene } from '../../domain/script/Scene.ts';
import type { AspectRatioText } from '../../domain/values/AspectRatio.ts';
import type { CastMember } from '../scenes/SceneRegistry.ts';
import type { PreviewState } from './previewState.ts';

export type ScenePreviewProps = Readonly<{
  scene: ScenarioScene;
  aspect: AspectRatioText;
  frames: number;
  cast: readonly CastMember[];
  states: Readonly<Record<string, PreviewState>>;
}>;

// The test scene of Task 12: a village at dusk with a campfire, the HUD of a chronicle and two worried villagers.
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
    effects: [{ type: 'fire' }, { type: 'particles', intensity: 0.6 }, { type: 'vignette', intensity: 0.75 }],
    hud: {
      fields: [{ label: 'ANO', value: '1347' }, { label: 'IDADE', value: '7' }, { label: 'ALDEIA', value: '190' }],
      bar: { label: 'CHANCE DE CHEGAR AOS 20', value: 65 },
    },
  },
  cast: [
    { id: 'ana', rig: 'ball-head', parameters: { outfit: 'dress', outfitColor: '#a5452f', hair: 'scarf', accessoryColor: '#e9dcc0' } },
    { id: 'beto', rig: 'ball-head', parameters: { outfit: 'tunic', outfitColor: '#6f7a32' } },
  ],
  states: { ana: { expression: 'surprised', pose: 'hands-on-mouth' }, beto: { expression: 'worried', pose: 'hand-on-head' } },
};
