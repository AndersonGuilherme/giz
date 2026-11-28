// The installers' file names in lowercase ASCII (gizzycera-…), like the deb, rpm and the Squirrel feed (RELEASES,
// .nupkg), which keep theirs: the makers name the others after the product name "Gizzycera", and a space (the
// Squirrel "Setup.exe") or an accent breaks download links, shells and some file systems.
import { rename } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

const PRODUCT = /^Gizzycera(?=[- ])/;

/** `name` without accents or spaces, the product part in lowercase (gizzycera). */
export function asciiArtifactName(name: string): string {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ +/g, '-');
  return plain.replace(PRODUCT, 'gizzycera');
}

type MakeResult = Readonly<{ artifacts: string[] }>;

/** Renames each artifact on disk to its ASCII name; the results name the new files. */
export async function renameArtifacts<Result extends MakeResult>(results: Result[]): Promise<Result[]> {
  const renamed = async (path: string) => {
    const target = join(dirname(path), asciiArtifactName(basename(path)));
    if (target !== path) await rename(path, target);
    return target;
  };
  return Promise.all(results.map(async (result) => ({ ...result, artifacts: await Promise.all(result.artifacts.map(renamed)) })));
}
