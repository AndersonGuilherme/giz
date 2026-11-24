import type { RigCatalog } from '../../application/ports/RigCatalog.ts';
import type { ProjectRepository } from '../../application/ports/ProjectRepository.ts';
import { Cast } from '../../domain/cast/Cast.ts';
import type { Character } from '../../domain/cast/Character.ts';
import type { Project } from '../../domain/project/Project.ts';
import { AspectRatio } from '../../domain/values/AspectRatio.ts';
import { characterSchema } from '../schema/characterSchema.ts';
import { projectSchema, type ProjectJson } from '../schema/projectSchema.ts';
import { scriptSchema, type ScriptJson } from '../schema/scriptSchema.ts';
import { ProblemCollector } from '../schema/errorMessages.ts';
import { rigParameters, requiredRigPresent } from '../schema/rigParameters.ts';
import { characterToDomain, projectToDomain, scriptToDomain } from '../schema/toDomain.ts';
import { checkCharactersOnStage, checkSpeakers } from '../schema/castReferences.ts';
import { imageWarnings } from './imageWarnings.ts';
import { readValidated } from './fileReading.ts';

type Loaded = Readonly<{ project: ProjectJson; script: ScriptJson; characters: readonly Character[] }>;

/** Reads `project.json`, `script.json` and `cast/<id>.json`, validates everything and returns the domain project. */
export class DiskProjectRepository implements ProjectRepository {
  readonly #catalog: RigCatalog;

  constructor({ catalog }: Readonly<{ catalog: RigCatalog }>) {
    this.#catalog = catalog;
  }

  async load(folder: string): Promise<Project> {
    const collector = new ProblemCollector();
    const project = await readValidated({ folder, file: 'project.json', collector }, projectSchema);
    const script = await readValidated({ folder, file: 'script.json', collector }, scriptSchema);
    const characters = await this.#readCharacters(folder, project?.cast ?? [], collector);
    if (!project || !script || !characters) return collector.fail();
    return this.#build(folder, { project, script, characters }, collector);
  }

  async #readCharacters(folder: string, ids: readonly string[], collector: ProblemCollector) {
    const characters: (Character | undefined)[] = [];
    for (const id of ids) characters.push(await this.#readCharacter(folder, id, collector));
    const loaded = characters.filter((character): character is Character => character !== undefined);
    return loaded.length === ids.length ? loaded : undefined;
  }

  async #readCharacter(folder: string, id: string, collector: ProblemCollector): Promise<Character | undefined> {
    const file = `cast/${id}.json`;
    const json = await readValidated({ folder, file, collector }, characterSchema);
    if (!json) return undefined;
    if (json.id !== id) collector.add({ file, path: 'id', message: `"${json.id}" difere do nome do arquivo (${id})` });
    if (!requiredRigPresent(json, { file, collector })) return undefined;
    return characterToDomain(json, rigParameters(json, this.#catalog, { file, collector }));
  }

  async #build(folder: string, loaded: Loaded, collector: ProblemCollector): Promise<Project> {
    const cast = Cast.of(loaded.characters);
    const script = scriptToDomain(loaded.script);
    checkSpeakers(script, cast, collector);
    checkCharactersOnStage(loaded.script, cast, collector);
    collector.failIfAny();
    const warnings = await imageWarnings(folder, loaded.script, AspectRatio.of(loaded.project.aspect));
    return projectToDomain(loaded.project, { cast, script, warnings });
  }
}
