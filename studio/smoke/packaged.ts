// The smoke walk on the packaged app (after `electron-forge package`): finds out/<name>-<platform>-<arch>/ and runs
// smoke/run.ts against its program. SMOKE_OFFLINE=1 (Linux) runs it all in a network namespace with only loopback
// (`unshare -rn`, then a nested user namespace back to the person's own uid: Electron refuses to run as root), so the
// renders and everything else prove they need no network.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(STUDIO, 'out');
const PROGRAM: Readonly<Record<string, string>> = { linux: 'giz-estudio', win32: 'giz-estudio.exe', darwin: 'Contents/MacOS/giz-estudio' };

const suffix = `-${process.platform}-${process.arch}`;
const folder = readdirSync(OUT).find((name) => name.endsWith(suffix));
if (!folder) throw new Error(`no packaged app in ${OUT} (run electron-forge package first)`);
const inside = process.platform === 'darwin' ? (readdirSync(join(OUT, folder)).find((name) => name.endsWith('.app')) ?? '') : '';
const program = join(OUT, folder, inside, PROGRAM[process.platform] ?? 'giz-estudio');
const env = { ...process.env, SMOKE_APP: program };
const smoke = ['node', join(STUDIO, 'smoke', 'run.ts')];
const me = `${process.getuid?.() ?? 1000}`;
const asMe = ['unshare', '-U', `--map-user=${me}`, `--map-group=${process.getgid?.() ?? 1000}`];
const offline = process.env.SMOKE_OFFLINE === '1' ? ['unshare', '-rn', 'sh', '-c', 'ip link set lo up && exec "$@"', 'offline', ...asMe] : [];
const [command, ...args] = [...offline, ...smoke];
console.log(`smoke: packaged app ${program}${offline.length ? ' (no network)' : ''}`);
process.exitCode = spawnSync(command, args, { stdio: 'inherit', env }).status ?? 1;
