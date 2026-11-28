import { DomainError } from '../../../domain/DomainError.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { ProjectError, problemLine } from '../../ports/ProjectError.ts';
import type { ProjectFiles, ProjectFolder } from '../../ports/ProjectFolder.ts';
import type { ProjectRepository } from '../../ports/ProjectRepository.ts';
import type { CheckProject } from '../CheckProject.ts';

/** What reviews a draft as `gizzy check` would: the real loader (schemas, cast, rigs) and the check. */
export type Reviewers = Readonly<{ folder: ProjectFolder; repository: ProjectRepository; check: CheckProject }>;

// A refused load lists every problem (file › field: message); anything else is a bug and goes up.
function loadProblems(error: unknown): string[] {
  if (error instanceof ProjectError) return error.problems.map(problemLine);
  if (error instanceof DomainError) return [error.message];
  throw error;
}

function checkProblems(project: Project, check: CheckProject): string[] {
  const { errors } = check.run(project);
  return errors.map(({ line, message }) => (line ? `fala ${line}: ${message}` : message));
}

async function reviewed(path: string, reviewers: Reviewers): Promise<string[]> {
  try {
    return checkProblems(await reviewers.repository.load(path), reviewers.check);
  } catch (error) {
    return loadProblems(error);
  }
}

/** The errors of a draft (the warnings do not stop it), loaded from a scratch folder that is removed afterwards. */
export function draftErrors(files: ProjectFiles, reviewers: Reviewers): Promise<string[]> {
  return reviewers.folder.staged(files, (path) => reviewed(path, reviewers));
}
