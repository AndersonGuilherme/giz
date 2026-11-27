import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

/** Every process under `root` in a `ps -A -o pid=,ppid=` table: children, their children, and so on. */
export function descendantsIn(table: string, root: number): number[] {
  const pairs = table.trim().split('\n').map((line) => line.trim().split(/\s+/).map(Number));
  const childrenOf = (parent: number): number[] => pairs.filter(([, ppid]) => ppid === parent).map(([pid]) => pid ?? 0);
  const walk = (parent: number): number[] => childrenOf(parent).flatMap((child) => [child, ...walk(child)]);
  return walk(root);
}

const signal = (pid: number) => {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // Already gone.
  }
};

/**
 * Stops the processes a worker started (the ONNX Runtime installer, tar): killing the worker alone would leave them
 * running. On Windows there is no GPU setup, so nothing below the worker needs this there.
 */
export async function killDescendants(root: number): Promise<void> {
  if (process.platform === 'win32') return;
  const { stdout } = await promisify(execFile)('ps', ['-A', '-o', 'pid=,ppid=']).catch(() => ({ stdout: '' }));
  descendantsIn(stdout, root).reverse().forEach(signal);
}

/** The same, at once (the app is quitting and will not wait for a promise). */
export function killDescendantsNow(root: number): void {
  if (process.platform === 'win32') return;
  const table = (() => {
    try {
      return execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' });
    } catch {
      return '';
    }
  })();
  descendantsIn(table, root).reverse().forEach(signal);
}
