const PROJECT_ARGUMENT = '--project=';

/** The folder of `--project=<folder>` on the command line ("open with"; the smoke test uses it too), or null. */
export function launchFolderOf(argv: readonly string[]): string | null {
  const argument = argv.find((value) => value.startsWith(PROJECT_ARGUMENT));
  return argument ? argument.slice(PROJECT_ARGUMENT.length) : null;
}
