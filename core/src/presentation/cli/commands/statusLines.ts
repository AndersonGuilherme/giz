import type { StageReport } from '../../../domain/stages/ProjectStages.ts';
import type { CostPart, PendingCosts } from '../../../domain/stages/PendingCosts.ts';
import type { StageName, StageState } from '../../../domain/stages/StageState.ts';
import { dollars } from '../dollars.ts';

/** Which service and model each paid step would use; absent when the project does not load. */
export type CostServices = Readonly<{ text: string; images?: string; voice?: string }>;

const SYMBOLS: Readonly<Record<StageState, string>> = { done: '✓', ready: '○', stale: '!', empty: '·' };
const STATES: Readonly<Record<StageState, string>> = { done: 'feito', ready: 'a fazer', stale: 'desatualizado', empty: 'vazio' };
// A script that is "stale" has errors: it is not out of date, it does not pass.
const STAGE_STATES: Readonly<Partial<Record<StageName, Partial<Record<StageState, string>>>>> = { script: { stale: 'com erros' } };
const STAGES: Readonly<Record<StageName, string>> = {
  idea: 'ideia', script: 'roteiro', cast: 'elenco', scenarios: 'cenários', voices: 'vozes', video: 'vídeo',
};
// The items of a stage are lines: their voice, or the image of their scene.
const ITEMS: Readonly<Partial<Record<StageName, string>>> = { voices: 'falas', scenarios: 'cenas das falas' };
const MAX_PROBLEMS = 10;

const stateText = ({ stage, state }: StageReport): string => STAGE_STATES[stage]?.[state] ?? STATES[state];

function itemsText({ stage, stale, missing }: StageReport): string {
  const items = ITEMS[stage];
  const parts = [{ label: 'desatualizadas', ids: stale }, { label: 'a gerar', ids: missing }].filter(({ ids }) => items && ids.length > 0);
  return parts.map(({ label, ids }) => ` — ${label}: ${items} ${ids.join(', ')}`).join('');
}

function problemLines({ problems }: StageReport): string[] {
  const shown = problems.slice(0, MAX_PROBLEMS).map((problem) => `    - ${problem}`);
  const hidden = problems.length - MAX_PROBLEMS;
  return hidden > 0 ? [...shown, `    (e mais ${hidden} problema(s))`] : shown;
}

/** One line per stage (symbol, name, state, the stale and missing items), then the script problems under it. */
export function stageLines(reports: readonly StageReport[]): string[] {
  return reports.flatMap((report) => [`${SYMBOLS[report.state]} ${STAGES[report.stage]}: ${stateText(report)}${itemsText(report)}`, ...problemLines(report)]);
}

const UNLOADED = 'desconhecido (o projeto não carrega)';

function partLine(label: string, part: CostPart, unit: string): string {
  if (part.count === undefined) return `  ${label}: ${UNLOADED}`;
  if (part.count === 0) return `  ${label}: nada pendente`;
  return `  ${label}: ${part.count} ${unit}, até ${dollars(part.cost)}`;
}

const service = (name: string | undefined) => (name ? ` (${name})` : '');

function textLine(costs: PendingCosts, services: CostServices): string[] {
  if (!costs.text) return [];
  const reason = costs.text.problem ? ` (${costs.text.problem})` : '';
  return [`  roteiro (${services.text}): até ${dollars(costs.text.cost)}${reason}`];
}

/** The cost of what is pending: the script (when it is), the images, the voices and the total. */
export function costLines(costs: PendingCosts, services: CostServices): string[] {
  return [
    'custo do que falta:',
    ...textLine(costs, services),
    partLine(`cenários${service(services.images)}`, costs.images, 'imagem(ns)'),
    partLine(`vozes${service(services.voice)}`, costs.voices, 'fala(s)'),
    `  total: até ${dollars(costs.total)}`,
  ];
}
