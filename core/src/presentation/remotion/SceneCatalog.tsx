import type { FC } from 'react';
import { Sequence, useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import { AspectRatio, type AspectRatioText } from '../../domain/values/AspectRatio.ts';
import { Language } from '../../domain/values/Language.ts';
import { Frame } from '../../domain/values/Time.ts';
import { sceneRegistry } from '../scenes/scenes.ts';
import { CATALOG_CAST, CATALOG_SAMPLES, type CatalogSample } from './catalogSamples.ts';
import { previewState } from './previewState.ts';

export type SceneCatalogProps = Readonly<{ aspect: AspectRatioText; language: 'pt-BR' | 'en' }>;

/** Frames per scene: scene k runs from k × 90; a still at k × 90 + 80 shows it settled. */
export const FRAMES_PER_SCENE = 90;

export const catalogMetadata: CalculateMetadataFunction<SceneCatalogProps> = ({ props }) => {
  const aspect = AspectRatio.of(props.aspect);
  return { width: aspect.width(), height: aspect.height(), durationInFrames: CATALOG_SAMPLES.length * FRAMES_PER_SCENE };
};

const Sample: FC<Readonly<{ sample: CatalogSample; props: SceneCatalogProps }>> = ({ sample, props }) => {
  const frame = useCurrentFrame();
  const { Component } = sceneRegistry.get(sample.scene.type);
  const stateOf = (characterId: string) => previewState(characterId, sample.states[characterId] ?? {}, Frame.of(frame));
  const progress = frame / (FRAMES_PER_SCENE - 1);
  return <Component scene={sample.scene} aspect={AspectRatio.of(props.aspect)} language={Language.of(props.language)} progress={progress} cast={CATALOG_CAST} stateOf={stateOf} />;
};

/** Every lesson scene with sample data, one after the other, for checking them by eye in 9:16 and 16:9. */
export const SceneCatalog: FC<SceneCatalogProps> = (props) => (
  <>
    {CATALOG_SAMPLES.map((sample, index) => (
      <Sequence key={index} from={index * FRAMES_PER_SCENE} durationInFrames={FRAMES_PER_SCENE}>
        <Sample sample={sample} props={props} />
      </Sequence>
    ))}
  </>
);
