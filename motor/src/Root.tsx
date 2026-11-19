import React from 'react';
import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { LessonVideo } from './Lesson';
import { CharacterSheet } from './CharacterSheet';
import type { LessonProps } from './types';

type Props = { lesson: string; data?: LessonProps; captions?: boolean };

// A aula a renderizar vem por --props='{"lesson":"<curso>-<NN>"}'; os dados são lidos de public/<aula>/props.json.
// Sem --props (ex.: npm run studio), abre a última aula montada pelo build (public/ultima-aula.json).
const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const key = props.lesson || ((await (await fetch(staticFile('ultima-aula.json'))).json()) as { lesson: string }).lesson;
  const data: LessonProps = await (await fetch(staticFile(`${key}/props.json`))).json();
  return { durationInFrames: data.totalFrames, fps: data.fps, props: { ...props, data } };
};

export const Root: React.FC = () => (
  <>
  <Composition id="CharacterSheet" component={CharacterSheet} width={1920} height={1600} fps={30} durationInFrames={1} />
  <Composition id="Lesson" component={LessonVideo} width={1920} height={1080} fps={30} durationInFrames={300}
    defaultProps={{ lesson: '', captions: true } as Props} calculateMetadata={calculateMetadata} />
  </>
);
