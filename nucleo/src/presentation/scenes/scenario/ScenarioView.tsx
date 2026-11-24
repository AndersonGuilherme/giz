import { useState, type FC } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { BackgroundSource } from '../../../domain/scenario/BackgroundSource.ts';
import { Placement } from '../../../domain/scenario/Placement.ts';
import { SceneCamera } from '../../../domain/scenario/SceneCamera.ts';
import type { Background, ScenarioScene } from '../../../domain/script/Scene.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import { Frame } from '../../../domain/values/Time.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { BackgroundView } from './BackgroundView.tsx';
import { BigTextView } from './BigTextView.tsx';
import { CameraPlane } from './CameraPlane.tsx';
import { CharactersInScene } from './CharactersInScene.tsx';
import { EffectsView } from './EffectsView.tsx';
import { HudView } from './HudView.tsx';

// An image that fails to load turns the background into the vector fallback on the next render.
function useBackgroundChoice(background: Background) {
  const [imageFailed, setImageFailed] = useState(false);
  return { choice: BackgroundSource.for(background, { imageFailed }), onImageError: () => setImageFailed(true) };
}

// The HUD and the big text stay on the glass: the camera does not move them.
const Overlays: FC<Readonly<{ scene: ScenarioScene; aspect: AspectRatio; frame: Frame }>> = ({ scene, aspect, frame }) => (
  <>
    {scene.hud && <HudView hud={scene.hud} aspect={aspect} />}
    {scene.highlight && <BigTextView bigText={scene.highlight} aspect={aspect} frame={frame} />}
  </>
);

/**
 * The scenario scene, back to front: background (back and middle layers with parallax), characters and world effects
 * moved by the camera, the background's front layer, screen effects, then the HUD and the big text, which stay still.
 */
export const ScenarioView: FC<SceneProps<ScenarioScene>> = ({ scene, aspect, progress, cast, stateOf }) => {
  const frame = Frame.of(useCurrentFrame());
  const { choice, onImageError } = useBackgroundChoice(scene.background);
  const spots = Placement.for(scene.characters, aspect);
  const camera = SceneCamera.of(scene.camera, spots, aspect).framingAt(progress, frame);
  const background = { choice, camera, aspect, onImageError };
  const effects = { effects: scene.effects ?? [], aspect, frame };
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#120b07' }}>
      <BackgroundView {...background} part="behind" />
      <CameraPlane framing={camera}>
        <CharactersInScene spots={spots} cast={cast} stateOf={stateOf} />
        <EffectsView {...effects} space="world" />
      </CameraPlane>
      <BackgroundView {...background} part="front" />
      <EffectsView {...effects} space="screen" />
      <Overlays scene={scene} aspect={aspect} frame={frame} />
    </AbsoluteFill>
  );
};
