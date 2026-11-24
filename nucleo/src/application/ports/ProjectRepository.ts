import type { Project } from '../../domain/project/Project.ts';

/** Loads a project from a folder; fails with `ProjectError` listing every problem found. */
export interface ProjectRepository {
  load(folder: string): Promise<Project>;
}
