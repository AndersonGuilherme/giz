// The installers' file names in ASCII (giz-estudio-…): the product name "giz Estúdio" has a space and an accent,
// which break download links, shells and some file systems. The deb, rpm and the Squirrel feed (RELEASES, .nupkg)
// already have ASCII names and must keep them.
import { rename } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

const PRODUCT = /^giz[ -]estudio/i;

/** `name` without accents or spaces, the product part as giz-estudio. */
export function asciiArtifactName(name: string): string {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ +/g, '-');
  return plain.replace(PRODUCT, 'giz-estudio');
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
