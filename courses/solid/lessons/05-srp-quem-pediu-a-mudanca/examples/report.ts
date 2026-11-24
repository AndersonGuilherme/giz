// Agrupa os pedidos de mudança por quem pediu. Rode: node report.ts
import { changeRequests, byActor, actorsPerSection } from './change-requests.ts';

for (const [actor, g] of byActor(changeRequests)) {
  console.log(`${actor.padEnd(12)} ${g.count} pedidos → ${[...g.sections].join(', ')}`);
}
const sections = actorsPerSection(changeRequests);
const max = Math.max(...[...sections.values()].map((a) => a.size));
console.log(`${changeRequests.length} pedidos · ${sections.size} trechos · ${byActor(changeRequests).size} atores`);
console.log(`Máximo de atores por trecho: ${max}`);
