/** The steps of a project, in order: each one uses what the ones before it made. */
export const STAGES = ['idea', 'script', 'cast', 'scenarios', 'voices', 'video'] as const;
export type StageName = (typeof STAGES)[number];

/**
 * empty: nothing made and nothing to make it from yet; ready: it can be made now (all or part of it is missing);
 * stale: something made is out of date (or, for the script, has errors) and must be made or fixed again; done: all
 * made and current.
 */
export const STAGE_STATES = ['empty', 'ready', 'stale', 'done'] as const;
export type StageState = (typeof STAGE_STATES)[number];
