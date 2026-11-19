// Efeitos sonoros sintetizados (sem arquivo de terceiros, sem licença a verificar) → assets/sfx/*.wav
// Uso: node scripts/sfx.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const RATE = 48000;
const out = resolve(import.meta.dirname, '..', 'assets', 'sfx');
mkdirSync(out, { recursive: true });

function wav(samples: Float32Array): Buffer {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24);
  b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return b;
}
const buf = (sec: number) => new Float32Array(Math.round(sec * RATE));
// tom com envelope de ataque/decaimento e frequência que pode variar no tempo
function tone(dst: Float32Array, at: number, dur: number, f0: number, f1: number, amp: number, decay = 8, shape: 'sine' | 'tri' = 'sine') {
  let phase = 0;
  const start = Math.round(at * RATE), n = Math.round(dur * RATE);
  for (let i = 0; i < n && start + i < dst.length; i++) {
    const t = i / RATE, p = i / n;
    phase += (2 * Math.PI * (f0 + (f1 - f0) * p)) / RATE;
    const osc = shape === 'sine' ? Math.sin(phase) : (2 / Math.PI) * Math.asin(Math.sin(phase));
    const env = Math.min(1, t / 0.004) * Math.exp(-decay * t);
    dst[start + i] += osc * env * amp;
  }
}
function noise(dst: Float32Array, at: number, dur: number, amp: number) {
  // ruído filtrado com corte subindo e descendo: "whoosh"
  let y = 0, seed = 7;
  const start = Math.round(at * RATE), n = Math.round(dur * RATE);
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = (seed / 2147483647) * 2 - 1, p = i / n;
    const a = 0.02 + 0.25 * Math.sin(Math.PI * p);
    y += a * (x - y);
    dst[start + i] += y * amp * Math.sin(Math.PI * p);
  }
}

const sounds: Record<string, () => Float32Array> = {
  pop: () => { const s = buf(0.18); tone(s, 0, 0.18, 520, 880, 0.7, 28); return s; },
  whoosh: () => { const s = buf(0.4); noise(s, 0, 0.4, 2.2); return s; },
  ding: () => { const s = buf(0.6); tone(s, 0, 0.6, 1318, 1318, 0.45, 7); tone(s, 0, 0.6, 1976, 1976, 0.18, 9); return s; },
  dings: () => { const s = buf(2.6); for (let k = 0; k < 9; k++) { const at = 2.2 * Math.pow(k / 9, 1.6); tone(s, at, 0.4, 1318 + (k % 3) * 120, 1318 + (k % 3) * 120, 0.32, 10); } return s; },
  error: () => { const s = buf(0.55); tone(s, 0, 0.22, 330, 300, 0.45, 6, 'tri'); tone(s, 0.22, 0.32, 247, 220, 0.45, 6, 'tri'); return s; },
  success: () => { const s = buf(0.7); [523, 659, 784].forEach((f, k) => tone(s, k * 0.09, 0.45, f, f, 0.38, 7)); return s; },
  tick: () => { const s = buf(0.08); tone(s, 0, 0.08, 1800, 1500, 0.4, 60); return s; },
};
for (const [name, make] of Object.entries(sounds)) writeFileSync(resolve(out, `${name}.wav`), wav(make()));
console.log(`ok: ${Object.keys(sounds).join(', ')} → ${out}`);
