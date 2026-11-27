import { Character, type ParameterValue } from '../../domain/cast/Character.ts';
import { type ProjectContent, Project } from '../../domain/project/Project.ts';
import { Chapter } from '../../domain/script/Chapter.ts';
import { Line } from '../../domain/script/Line.ts';
import { Lines } from '../../domain/script/Lines.ts';
import { Script } from '../../domain/script/Script.ts';
import { CharacterId } from '../../domain/values/CharacterId.ts';
import { Language } from '../../domain/values/Language.ts';
import { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { CharacterJson } from './characterSchema.ts';
import type { ProjectJson } from './projectSchema.ts';
import type { LineJson, ScriptJson } from './scriptSchema.ts';

/** Conversions from already validated JSON to the domain: one function per entity. */
export function characterToDomain(json: CharacterJson, parameters: Record<string, ParameterValue>): Character {
  const { id, ...profile } = json;
  return Character.of(CharacterId.of(id), { ...profile, parameters });
}

export function lineToDomain(json: LineJson): Line {
  const { speaker, chapter, ...data } = json;
  return Line.of(CharacterId.of(speaker), { ...data, chapter: Chapter.of(chapter) });
}

export function scriptToDomain(json: ScriptJson): Script {
  return Script.of(json.chapters, Lines.of(json.lines.map(lineToDomain)));
}

export function projectToDomain(json: ProjectJson, content: ProjectContent): Project {
  const profile = {
    title: json.title,
    format: json.format,
    language: Language.of(json.language),
    aspect: AspectRatio.of(json.aspect),
    brand: json.brand,
    captionStyle: json.captionStyle,
    voice: json.voice,
    style: json.style,
    imageProvider: json.imageProvider,
  };
  return Project.of(profile, content);
}
