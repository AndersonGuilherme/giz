import type { FC } from 'react';
import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { CharacterSheet, type CharacterSheetProps } from './CharacterSheet.tsx';
import { PREVIEW_DEFAULTS } from './previewScene.ts';
import { catalogMetadata, FRAMES_PER_SCENE, SceneCatalog } from './SceneCatalog.tsx';
import { CATALOG_SAMPLES } from './catalogSamples.ts';
import { PresetSheet, presetSheetMetadata } from './PresetSheet.tsx';
import { previewMetadata, ScenePreview } from './ScenePreview.tsx';
import { EMPTY_VIDEO } from './emptyVideo.ts';
import { Video, videoMetadata } from './Video.tsx';

// `character` is a cast JSON path relative to the public folder (`--public-dir` can point at a project).
const readCharacter: CalculateMetadataFunction<CharacterSheetProps> = async ({ props }) => {
  if (!props.character) return {};
  const json = await (await fetch(staticFile(props.character))).json();
  return { props: { ...props, rig: json.rig ?? props.rig, parameters: json.parameters ?? {} } };
};

const SheetComposition: FC = () => (
  <Composition
    id="CharacterSheet"
    component={CharacterSheet}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={1}
    defaultProps={{ rig: 'giz' }}
    calculateMetadata={readCharacter}
  />
);

// One scene alone with fixed character states; `--props` replaces the scene, the aspect, the frames, the cast or the states.
const PreviewComposition: FC = () => (
  <Composition
    id="ScenePreview"
    component={ScenePreview}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={PREVIEW_DEFAULTS.frames}
    defaultProps={PREVIEW_DEFAULTS}
    calculateMetadata={previewMetadata}
  />
);

// Every lesson scene with sample data (`--props='{"aspect":"9:16"}'` for the vertical version).
const CatalogComposition: FC = () => (
  <Composition
    id="SceneCatalog"
    component={SceneCatalog}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={CATALOG_SAMPLES.length * FRAMES_PER_SCENE}
    defaultProps={{ aspect: '16:9', language: 'pt-BR' }}
    calculateMetadata={catalogMetadata}
  />
);

// The video of a project: `--props` (or `renderMedia`'s `inputProps`) is the VideoProps that `giz build` writes to
// `output/props.json`; the audio paths in it are relative to the public folder.
const VideoComposition: FC = () => (
  <Composition id="Video" component={Video} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={EMPTY_VIDEO} calculateMetadata={videoMetadata} />
);

// A gallery of cast files (`characters`: paths relative to the public folder, e.g. `--public-dir=casts/presets`).
const PresetSheetComposition: FC = () => (
  <Composition
    id="PresetSheet"
    component={PresetSheet}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={1}
    defaultProps={{ title: 'passado', characters: [] }}
    calculateMetadata={presetSheetMetadata}
  />
);

export const Root: FC = () => (
  <>
    <VideoComposition />
    <SheetComposition />
    <PreviewComposition />
    <CatalogComposition />
    <PresetSheetComposition />
  </>
);
