import type { IdeaFields } from '../../../shared/projects.ts';

// The rehearsal script's texts, in the language of the idea.
const TEXTS = {
  'pt-BR': {
    narrator: 'Narrador', style: 'Fale em português do Brasil, com sotaque brasileiro, de forma natural', chapters: ['O começo', 'A virada'],
    lines: ['Tudo começou numa manhã comum.', 'Ninguém esperava o que viria [depois].', 'E foi assim que a história começou.'],
  },
  en: {
    narrator: 'Narrator', style: 'Speak in natural American English', chapters: ['The beginning', 'The turn'],
    lines: ['It all began on an ordinary morning.', 'Nobody expected what came [next].', 'And that is how the story began.'],
  },
} as const;

const DEFAULT_CAST = { story: ['bia', 'caio'], lesson: ['lia', 'teo'] } as const;

type Line = Readonly<Record<string, unknown>>;

function sceneOf(idea: IdeaFields, stage: readonly string[]): Line {
  if (idea.format === 'lesson') return { type: 'title', overline: '', title: idea.theme.slice(0, 40) };
  const positions = stage.length === 1 ? ['center'] : ['left', 'right'];
  return { type: 'scenario', background: { vector: 'street' }, characters: stage.map((character, index) => ({ character, position: positions[index] })) };
}

/**
 * The answer a pretend text AI gives in rehearsal mode (`GIZZY_STUDIO_REHEARSAL=1`): a short valid script for the idea,
 * with its chosen cast and a narrator. `broken` gives a pose that does not exist, which core sends back for repair.
 */
export function rehearsalAnswer(idea: IdeaFields, broken: boolean): unknown {
  const texts = TEXTS[idea.language];
  const cast = idea.cast?.length ? idea.cast : DEFAULT_CAST[idea.format];
  const stage = cast.slice(0, 2);
  const speakers = ['narrator', stage[0] ?? 'narrator', stage[1] ?? 'narrator'];
  const lines: Line[] = texts.lines.map((text, index) => ({ id: `0${index + 1}`, chapter: index === 0 ? 1 : 2, speaker: speakers[index], text }));
  const script = [{ ...lines[0], scene: sceneOf(idea, stage) }, { ...lines[1], pose: broken ? 'dance' : 'explain', beats: [{ expression: 'surprised' }] }, lines[2]];
  const narrator = { id: 'narrator', name: texts.narrator, voice: { id: 'ryan', style: texts.style }, defaultExpression: 'neutral' };
  return { project: { title: idea.theme.slice(0, 60) }, cast: [...cast, narrator], script: { chapters: texts.chapters, lines: script } };
}
