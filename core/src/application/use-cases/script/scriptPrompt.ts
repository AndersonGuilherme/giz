import { VECTOR_BACKGROUNDS } from '../../../domain/scenario/BackgroundSource.ts';
import type { Idea } from '../../../domain/idea/Idea.ts';
import { scriptOutputTokens } from '../../../domain/idea/speechPace.ts';
import type { TextRequest } from '../../ports/TextProvider.ts';
import type { CastPreset, ScenePreset } from '../../ports/ScriptMaterials.ts';

/** Everything the prompt is built from besides the idea (all read from data: guides, schemas, presets, rigs). */
export type PromptMaterials = Readonly<{
  guide: string;
  reference: string;
  castPresets: readonly CastPreset[];
  scenePresets: readonly ScenePreset[];
  rigs: string;
  voices: readonly string[];
}>;

const LANGUAGE_NAMES = { 'pt-BR': 'Brazilian Portuguese (pt-BR)', en: 'English (en)' } as const;

function system(idea: Idea): string {
  return [
    'You write scripts for giz, an engine that turns a JSON script into an animated video with voices, characters and captions.',
    'Answer with a single JSON object and nothing else (no comments, no Markdown), following the answer schema you are given.',
    'Originality: everything must be original. Never imitate, copy or reference any specific existing video, channel, creator, show, film, game or character; create your own characters, plot, jokes and lines.',
    `Every text that is spoken or shown (lines, chapters, title, labels) is in ${LANGUAGE_NAMES[idea.language().code()]}.`,
  ].join('\n');
}

function choiceLine(names: readonly string[], chosen: string, free: string): string {
  return names.length > 0 ? `${chosen}: ${names.join(', ')}` : free;
}

function ideaSection(idea: Idea): string {
  const json = idea.toJson();
  return [
    '# Idea',
    `- format: ${json.format}`,
    `- aspect: ${json.aspect}`,
    `- target duration: ${json.targetSeconds} s (about ${idea.targetWords()} words of speech in total)`,
    `- theme: ${json.theme}`,
    `- audience: ${json.audience}`,
    `- tone: ${json.tone}`,
    `- language: ${json.language}`,
    `- cast: ${choiceLine(idea.castIds(), 'use these cast presets', 'choose from the cast presets below or create new characters')}`,
    `- scenes: ${choiceLine(idea.sceneNames(), 'use these backgrounds or scene presets', 'choose the backgrounds and scene presets that fit')}`,
  ].join('\n');
}

function answerSection(reference: string): string {
  return [
    '# Answer',
    'A JSON object with "project" ({ "title", optional "captionStyle" }), "cast" and "script".',
    '"cast" lists everyone who speaks or appears: a cast preset id as a string, or a whole new character object (a narrator has no "rig").',
    '"script" is the script.json: "chapters" and "lines". Every "speaker" and scene "characters[].character" must be in "cast".',
    'JSON schema of the answer:',
    reference,
  ].join('\n');
}

const castLine = (preset: CastPreset) =>
  `- ${preset.id}: ${preset.name}, ${preset.personality} (rig ${preset.rig ?? 'none: voice only'}, voice ${preset.voice})`;

// The requested scene presets, or all of them; each with its scene JSON, which is copied into a line's "scene".
function scenePresetsOf(idea: Idea, presets: readonly ScenePreset[]): readonly ScenePreset[] {
  const names = idea.sceneNames();
  return names.length > 0 ? presets.filter(({ id }) => names.includes(id)) : presets;
}

const sceneLine = (preset: ScenePreset) =>
  `- ${preset.id} (${preset.name}: ${preset.description}): ${JSON.stringify(preset.scene)}`;

function librarySection(idea: Idea, materials: PromptMaterials): string {
  return [
    '# Cast presets',
    ...materials.castPresets.map(castLine),
    '# Rigs and parameters (for new characters)',
    materials.rigs,
    `# Voices: ${materials.voices.join(', ')}`,
    `# Vector backgrounds: ${VECTOR_BACKGROUNDS.join(', ')}`,
    '# Scene presets (copy the JSON into the line\'s "scene" and fill "characters")',
    ...scenePresetsOf(idea, materials.scenePresets).map(sceneLine),
  ].join('\n');
}

/** The request for a script: the rules (system), then the idea, the format guide, the answer schema and the presets. */
export function scriptRequest(idea: Idea, materials: PromptMaterials): TextRequest {
  const sections = [ideaSection(idea), `# Format guide\n${materials.guide}`, answerSection(materials.reference), librarySection(idea, materials)];
  return { system: system(idea), prompt: sections.join('\n\n'), maxTokens: scriptOutputTokens(idea.targetSeconds()), json: true };
}

/** The same request with the previous answer and its problems: the AI answers again with the whole corrected JSON. */
export function repairRequest(base: TextRequest, answer: string, problems: readonly string[]): TextRequest {
  const repair = [
    '# Your previous answer',
    answer,
    '# Problems found by the validation (fix every one and keep what was right)',
    ...problems.map((problem) => `- ${problem}`),
    'Answer again with the whole corrected JSON object.',
  ];
  return { ...base, prompt: `${base.prompt}\n\n${repair.join('\n')}` };
}
