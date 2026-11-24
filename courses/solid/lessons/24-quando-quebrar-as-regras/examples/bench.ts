// Mede as três versões com 1 milhão de preços. Uso: node bench.ts
import { rulesPerItem, rulesOnce, handWritten } from './hot-path.ts';

const prices = new Int32Array(1_000_000).map((_, i) => 1000 + (i % 50_000));
const vip = { type: 'vip' as const };
const versions = [['regras por item', rulesPerItem], ['regras na borda', rulesOnce], ['à mão', handWritten]] as const;

for (const [name, fn] of versions) {
  fn(prices, vip, true); // aquece
  const t0 = performance.now();
  const total = fn(prices, vip, true);
  console.log(`${name.padEnd(16)} ${(performance.now() - t0).toFixed(1).padStart(6)} ms  total ${total}`);
}
