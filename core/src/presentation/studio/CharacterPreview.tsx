import type { FC } from 'react';
import { AbsoluteFill, Html5Audio, useCurrentFrame } from 'remotion';
import { rigModels } from '../rigs/rigModels.ts';
import { previewStateAt, type CharacterPreviewProps } from './previewState.ts';

export type { CharacterPreviewProps, PreviewSpeech } from './previewState.ts';

/** The live preview: the character centered at the bottom of a transparent frame, with the sample's audio. */
export const CharacterPreview: FC<CharacterPreviewProps> = (props) => {
  const frame = useCurrentFrame();
  const model = rigModels.get(props.rig);
  const state = previewStateAt(props, frame);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <model.Component state={state} parameters={props.parameters} height={props.height} side={1} id={props.id} />
      {props.speech?.audio && <Html5Audio src={props.speech.audio} />}
    </AbsoluteFill>
  );
};
