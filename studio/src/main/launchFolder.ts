import { resolve } from 'node:path';

const PROJECT_ARGUMENT = '--project=';

/**
 * The folder of `--project=<folder>` on the command line ("open with"; the smoke test uses it too), or null; a relative
 * folder is read from `workingDirectory` (a second launch's own, which is not this process's).
 */
export function launchFolderOf(argv: readonly string[], workingDirectory: string = process.cwd()): string | null {
  const folder = argv.find((value) => value.startsWith(PROJECT_ARGUMENT))?.slice(PROJECT_ARGUMENT.length);
  return folder ? resolve(workingDirectory, folder) : null;
}
