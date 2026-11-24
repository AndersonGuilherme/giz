import type { FC } from 'react';
import { useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import { AspectRatio } from '../../domain/values/AspectRatio.ts';
import { Language } from '../../domain/values/Language.ts';
import { Frame } from '../../domain/values/Time.ts';
import { sceneRegistry } from '../scenes/scenes.ts';
import type { ScenePreviewProps } from './previewScene.ts';
import { previewState } from './previewState.ts';

/** Size and length come from the props: `aspect` picks 1080×1920 or 1920×1080, `frames` the duration. */
export const previewMetadata: CalculateMetadataFunction<ScenePreviewProps> = ({ props }) => {
  const aspect = AspectRatio.of(props.aspect);
  return { width: aspect.width(), height: aspect.height(), durationInFrames: props.frames };
};

/** One scene JSON alone, for N frames, with fixed character states (no audio): for checking a scene by eye. */
export const ScenePreview: FC<ScenePreviewProps> = ({ scene, aspect, language = 'pt-BR', frames, cast, states }) => {
  const frame = useCurrentFrame();
  const { Component } = sceneRegistry.get(scene.type);
  const stateOf = (characterId: string) => previewState(characterId, states[characterId] ?? {}, Frame.of(frame));
  const progress = frames > 1 ? frame / (frames - 1) : 0;
  return <Component scene={scene} aspect={AspectRatio.of(aspect)} language={Language.of(language)} progress={progress} cast={cast} stateOf={stateOf} />;
};
