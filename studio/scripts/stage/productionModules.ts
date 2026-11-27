// The modules core needs at run time, found the way Node finds them: each dependency (and optional or peer one, when
// installed) from the folder of the package that asks for it, upwards. The roots that only build (the Remotion CLI and
// bundler, webpack and friends: the installed app renders from the prebuilt bundle) are left out with all they bring.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const BUILD_ONLY = new Set(['@remotion/cli', '@remotion/bundler']);

type Manifest = Readonly<{ dependencies?: Record<string, string>; optionalDependencies?: Record<string, string>; peerDependencies?: Record<string, string> }>;

const manifestOf = (folder: string): Manifest => JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')) as Manifest;
const namesOf = (manifest: Manifest): string[] => Object.keys({ ...manifest.peerDependencies, ...manifest.optionalDependencies, ...manifest.dependencies });

// <from>/node_modules/<name>, then the same from each folder above, up to the package root.
function found(name: string, from: string, root: string): string | undefined {
  const candidate = join(from, 'node_modules', name);
  if (existsSync(join(candidate, 'package.json'))) return candidate;
  if (from === root) return undefined;
  return found(name, dirname(from), root);
}

// Adds the module `name` asks for from `from`, and returns what that module asks for in turn (nothing if seen).
function visit(name: string, from: string, context: Readonly<{ root: string; seen: Set<string> }>): Array<{ name: string; from: string }> {
  const folder = found(name, from, context.root);
  if (!folder || context.seen.has(folder)) return [];
  context.seen.add(folder);
  return namesOf(manifestOf(folder)).map((dependency) => ({ name: dependency, from: folder }));
}

/** The folders (relative to `root`) of every module `root`'s production dependencies reach, build-only roots excluded. */
export function productionModules(root: string): string[] {
  const context = { root, seen: new Set<string>() };
  const pending = namesOf(manifestOf(root)).filter((name) => !BUILD_ONLY.has(name)).map((name) => ({ name, from: root }));
  for (let next = pending.pop(); next; next = pending.pop()) pending.push(...visit(next.name, next.from, context));
  return [...context.seen].map((folder) => relative(root, folder)).sort();
}
