// What of core's modules the installed app never uses: source maps, other machines' binaries, the CUDA provider (the
// GPU install downloads it; most machines have no NVIDIA card), the musl builds (Electron itself needs glibc) and the
// Whisper the developer downloaded into transformers' own cache.
import { sep } from 'node:path';

const machine = `${process.platform}/${process.arch}`;
const CUDA_FILES = /^libonnxruntime_providers_(cuda|tensorrt|shared)\.(so|dll)$/;

// onnxruntime-node ships every platform under bin/napi-v6/<platform>/<arch>: only this machine's stays.
function otherMachine(inPackage: string): boolean {
  const found = inPackage.match(/^bin\/napi-v\d+\/([^/]+)(?:\/([^/]+))?/);
  if (!found) return false;
  return !machine.startsWith(found[2] ? `${found[1]}/${found[2]}` : `${found[1]}/`);
}

// Inside any module: maps, executables' links, nested modules (staged on their own), tests, examples, docs, Markdown
// (licenses stay) and type declarations: nothing the app runs.
const UNUSED_FOLDERS = new Set(['.bin', 'test', 'tests', 'example', 'examples', 'docs']);
const UNUSED_FILES = /\.(map|md|d\.ts|d\.mts|d\.cts)$/;
const LICENSES = /^(LICEN[CS]E|NOTICE|COPYING)/i;
const unusedFile = (name: string): boolean => UNUSED_FILES.test(name) && !LICENSES.test(name);
const anywhere = (inPackage: string, name: string): boolean => UNUSED_FOLDERS.has(name) || unusedFile(name) || inPackage.startsWith('node_modules');

const IN_MODULE: ReadonlyArray<readonly [string, (inPackage: string, name: string) => boolean]> = [
  ['@huggingface/transformers', (inPackage) => inPackage === '.cache'],
  ['onnxruntime-node', (inPackage, name) => otherMachine(inPackage) || CUDA_FILES.test(name)],
];

/** Whether a file or folder of the module at `module` (relative to core) stays out; `inPackage`: its path inside it. */
export function leftOut(module: string, inPackage: string): boolean {
  const name = inPackage.split('/').pop() ?? '';
  const rule = IN_MODULE.find(([suffix]) => module.endsWith(suffix));
  return anywhere(inPackage, name) || (rule?.[1](inPackage, name) ?? false);
}

/** Whole modules that stay out. */
export const moduleLeftOut = (module: string): boolean => /musl/.test(module.split(sep).join('/'));
