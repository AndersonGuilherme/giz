/**
 * A scenario image that cannot be made as asked: a selection naming a line without `background.generate`, or a
 * `scenes/<id>.png` that `giz images` did not make (it never overwrites the person's files). Shown as it is, no stack.
 */
export class ScenarioImageError extends Error {
  override readonly name = 'ScenarioImageError';
}
