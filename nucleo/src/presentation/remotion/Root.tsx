import type { FC } from 'react';
import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { CharacterSheet, type CharacterSheetProps } from './CharacterSheet.tsx';

// `character` is a cast JSON path relative to the public folder (`--public-dir` can point at a project).
const readCharacter: CalculateMetadataFunction<CharacterSheetProps> = async ({ props }) => {
  if (!props.character) return {};
  const json = await (await fetch(staticFile(props.character))).json();
  return { props: { ...props, rig: json.rig ?? props.rig, parameters: json.parameters ?? {} } };
};

export const Root: FC = () => (
  <Composition
    id="CharacterSheet"
    component={CharacterSheet}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={1}
    defaultProps={{ rig: 'ball-head' }}
    calculateMetadata={readCharacter}
  />
);
