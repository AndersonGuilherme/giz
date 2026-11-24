import { BigTextLayout } from '../scenario/BigTextLayout.ts';
import { HudLayout } from '../scenario/HudLayout.ts';
import { Placement } from '../scenario/Placement.ts';
import { SceneCamera } from '../scenario/SceneCamera.ts';
import type { ScenarioScene } from '../script/Scene.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Boxes } from './Boxes.ts';
import type { LayoutRegistry } from './LayoutRegistry.ts';

/**
 * The text boxes of a scenario (HUD and big text). The characters are not boxes: the caption may cover their legs,
 * as in short story videos. Placing them and aiming the camera still run here, so that too many characters or a
 * camera target out of the scene become `check` errors.
 */
export function scenarioBoxes(scene: ScenarioScene, aspect: AspectRatio): Boxes {
  const spots = Placement.for(scene.characters, aspect);
  SceneCamera.of(scene.camera, spots, aspect);
  const hud = scene.hud ? HudLayout.for(scene.hud, aspect).boxes() : Boxes.empty();
  if (!scene.highlight) return hud;
  return hud.plus(BigTextLayout.for(scene.highlight, aspect).boxes());
}

export function registerScenarioLayout(registry: LayoutRegistry): LayoutRegistry {
  return registry.register('scenario', scenarioBoxes);
}
