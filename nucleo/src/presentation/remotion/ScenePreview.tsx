import type { FC } from 'react';
import { useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import { AspectRatio } from '../../domain/values/AspectRatio.ts';
import { Language } from '../../domain/values/Language.ts';
import { Words } from '../../domain/speech/Words.ts';
import { Frame } from '../../domain/values/Time.ts';
import { CAPTION_VIEWS } from '../captions/captionRegistry.ts';
import { sceneRegistry } from '../scenes/scenes.ts';
import type { ScenePreviewProps } from './previewScene.ts';
import { previewState } from './previewState.ts';

/** Size and length come from the props: `aspect` picks 1080×1920 or 1920×1080, `frames` the duration. */
export const previewMetadata: CalculateMetadataFunction<ScenePreviewProps> = ({ props }) => {
  const aspect = AspectRatio.of(props.aspect);
  return { width: aspect.width(), height: aspect.height(), durationInFrames: props.frames };
};

// Without recorded times, the caption spreads the words over the preview by letters (the fallback of old voices).
const PreviewCaption: FC<Readonly<{ caption: NonNullable<ScenePreviewProps['caption']>; aspect: AspectRatio; frames: number; frame: number }>> = ({ caption, aspect, frames, frame }) => {
  const View = CAPTION_VIEWS[caption.format];
  const words = Words.fromText(caption.text).texts().map((text) => ({ text, start: 0, end: 0 }));
  return <View words={words} lineDuration={frames} aspect={aspect} frame={Frame.of(frame)} />;
};

/** One scene JSON alone, for N frames, with fixed character states (no audio): for checking a scene by eye. */
export const ScenePreview: FC<ScenePreviewProps> = ({ scene, aspect, language = 'pt-BR', frames, cast, states, caption }) => {
  const frame = useCurrentFrame();
  const { Component } = sceneRegistry.get(scene.type);
  const stateOf = (characterId: string) => previewState(characterId, states[characterId] ?? {}, Frame.of(frame));
  const progress = frames > 1 ? frame / (frames - 1) : 0;
  const ratio = AspectRatio.of(aspect);
  return (
    <>
      <Component scene={scene} aspect={ratio} language={Language.of(language)} progress={progress} cast={cast} stateOf={stateOf} />
      {caption && <PreviewCaption caption={caption} aspect={ratio} frames={frames} frame={frame} />}
    </>
  );
};
