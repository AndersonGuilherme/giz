import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import type { VoiceRequest, VoiceProvider } from '../ports/VoiceProvider.ts';
import { hexDigest } from './hexDigest.ts';

/** What the voice of a line would be made from now, and its hash (compared with the saved one). */
export type CurrentVoice = Readonly<{ request: VoiceRequest; hash: string }>;

const sha1 = (text: string): Promise<string> => hexDigest('SHA-1', text);

function lineRequest(project: Project, line: Line): VoiceRequest {
  const cast = project.cast();
  const character = cast.character(line.speaker());
  const { id, style } = character.voice();
  const lexicon = project.lexicon();
  return { lineId: line.id(), text: lexicon.apply(line.pronunciation()), voice: id, style, language: project.language() };
}

// Changing any of these fields re-records the line; the rest (pose, scene...) does not touch the voice. The model and
// the provider fingerprint (a recording take) go in only when present, so the hash of a line without them is unchanged.
function lineHash(project: Project, line: Line, source: Readonly<{ request: VoiceRequest; fingerprint: string }>): Promise<string> {
  const { provider, model } = project.voice();
  const { request, fingerprint } = source;
  const language = request.language;
  const fields = [line.text(), request.text, request.voice, request.style ?? '', language.code(), provider];
  const extras = [model, fingerprint].filter((field) => field);
  return sha1([...fields, ...extras].join('|'));
}

/** The request of the line for the project voice and its hash: the same line, voice and settings give the same hash. */
export async function currentVoice(project: Project, line: Line, voice: VoiceProvider): Promise<CurrentVoice> {
  const request = lineRequest(project, line);
  const fingerprint = (await voice.fingerprint?.(request)) ?? '';
  return { request, hash: await lineHash(project, line, { request, fingerprint }) };
}
