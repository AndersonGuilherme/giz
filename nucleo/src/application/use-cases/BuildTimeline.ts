import { DomainError } from '../../domain/DomainError.ts';
import type { Cast } from '../../domain/cast/Cast.ts';
import type { Character } from '../../domain/cast/Character.ts';
import type { SoundEffectJson, CharacterJson, VideoProps, SegmentJson } from '../../domain/timeline/VideoProps.ts';
import { SceneSequence } from '../../domain/timeline/SceneSequence.ts';
import type { LineVoice } from '../../domain/timeline/LineTimings.ts';
import { LineSegment } from '../../domain/timeline/LineSegment.ts';
import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import { Fps } from '../../domain/values/Time.ts';
import type { VoiceStore } from '../ports/VoiceStore.ts';

type Dependencies = Readonly<{ store: VoiceStore }>;
type Assembly = { segments: SegmentJson[]; soundEffects: SoundEffectJson[]; totalFrames: number };

function linesOf(project: Project): readonly Line[] {
  const script = project.script();
  const lines = script.lines();
  return lines.each();
}

function characterToJson(character: Character): CharacterJson {
  const id = character.id();
  const rig = character.rig();
  const common = { id: id.text(), name: character.name(), parameters: { ...character.parameters() }, defaultExpression: character.defaultExpression() };
  return rig === undefined ? common : { ...common, rig };
}

function profileToJson(project: Project) {
  const aspect = project.aspect();
  const language = project.language();
  const script = project.script();
  const brand = project.brand();
  return {
    fps: Fps.DEFAULT.value(), width: aspect.width(), height: aspect.height(), language: language.code(), format: project.format(),
    captionStyle: project.captionStyle(), ...(brand === undefined ? {} : { brand }), title: project.title(), chapters: [...script.chapters()],
  };
}

/** Builds the video props: each line becomes a segment, one after the other, with the voice already saved. */
export class BuildTimeline {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async run(project: Project): Promise<VideoProps> {
    const lines = linesOf(project);
    this.#rejectLinesWithoutAudio(lines);
    const voices = await Promise.all(lines.map((line) => this.#dependencies.store.read(line.id())));
    const cast = project.cast();
    const assembly = buildSegments(lines, voices, cast);
    return { ...profileToJson(project), ...assembly, cast: cast.each().map(characterToJson) };
  }

  #rejectLinesWithoutAudio(lines: readonly Line[]): void {
    const { store } = this.#dependencies;
    const withoutAudio = lines.filter((line) => store.savedHash(line.id()) === undefined);
    if (withoutAudio.length === 0) return;
    throw new DomainError(`falas sem áudio: ${withoutAudio.map((line) => line.id()).join(', ')} (gere as vozes antes de montar o vídeo)`);
  }
}

// The lines in sequence: the scene carries from one to the next and each segment starts where the previous one ends.
function buildSegments(lines: readonly Line[], voices: readonly LineVoice[], cast: Cast): Assembly {
  const scenes = new SceneSequence();
  const assembly: Assembly = { segments: [], soundEffects: [], totalFrames: 0 };
  lines.forEach((line, index) => {
    const voice = voices[index] as LineVoice;
    const segment = LineSegment.build(line, voice, { start: assembly.totalFrames, scene: scenes.sceneOf(line), cast });
    scenes.continueWith(segment.sceneAfter());
    assembly.segments.push(segment.toJson());
    assembly.soundEffects.push(...segment.soundEffects());
    assembly.totalFrames = segment.end();
  });
  return assembly;
}
