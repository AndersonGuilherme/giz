// Part of the composition point (see composition.ts): what a script editor offers and checks (the Studio's editor).
import type { Problem } from '../../../application/ports/ProjectError.ts';
import { EXPRESSIONS, POSES } from '../../../domain/cast/PoseAndExpression.ts';
import { VECTOR_BACKGROUNDS } from '../../../domain/scenario/BackgroundSource.ts';
import { CARD_VARIANTS, TERMINAL_TONES } from '../../../domain/script/LessonScenes.ts';
import { GAZES, SOUND_EFFECTS } from '../../../domain/script/Line.ts';
import { DIRECTIONS, NAMED_POSITIONS } from '../../../domain/script/Scene.ts';
import { EFFECT_TYPES, MOVE_TYPES } from '../../../domain/script/SceneElements.ts';
import { SCENE_TYPES, sceneProblems } from '../../../infrastructure/schema/sceneCheck.ts';

/** The lists the editor's pickers offer, straight from the domain (never copied by hand). */
export function scriptVocabulary() {
  return {
    poses: POSES, expressions: EXPRESSIONS, looks: GAZES, sounds: SOUND_EFFECTS, sceneTypes: SCENE_TYPES, backgrounds: VECTOR_BACKGROUNDS,
    positions: NAMED_POSITIONS, directions: DIRECTIONS, cameraMoves: MOVE_TYPES, effects: EFFECT_TYPES, cardVariants: CARD_VARIANTS, terminalTones: TERMINAL_TONES,
  } as const;
}

export type ScriptVocabulary = ReturnType<typeof scriptVocabulary>;

/** The schema problems of one scene, with readable pt-BR messages; none when it is valid. */
export function checkScene(scene: unknown): readonly Problem[] {
  return sceneProblems(scene);
}
