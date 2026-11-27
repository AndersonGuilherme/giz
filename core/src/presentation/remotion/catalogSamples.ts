import type { LessonScene } from '../../domain/script/LessonScenes.ts';
import type { CastMember } from '../scenes/SceneRegistry.ts';
import type { PreviewState } from './previewState.ts';

/** One lesson scene of the catalog, with the presenters' fixed states. */
export type CatalogSample = Readonly<{ scene: LessonScene; states: Readonly<Record<string, PreviewState>> }>;

// Lia and Téo, as in `casts/example/` (the look of the old motor's presenters).
export const CATALOG_CAST: readonly CastMember[] = [
  { id: 'lia', rig: 'lia-style', parameters: { hair: 'bun', hoodieColor: '#8B3FF5', hoodieShade: '#6A22D6', emblem: 'star', browWidth: 7, browArch: 7, smile: 30 } },
  { id: 'teo', rig: 'lia-style', parameters: { hair: 'short', hoodieColor: '#4F35D9', hoodieShade: '#3A22B0', emblem: 'code', browWidth: 10, browArch: 2, smile: 24 } },
];

const EXPLAINING = { lia: { pose: 'explain', expression: 'happy', look: 'content' }, teo: { expression: 'neutral', look: 'content' } } as const;
const POINTING = { lia: { pose: 'point', expression: 'excited', look: 'content' }, teo: { expression: 'surprised', look: 'content' } } as const;

/** Every lesson scene with sample data from the SOLID lessons, in the order the catalog shows them. */
export const CATALOG_SAMPLES: readonly CatalogSample[] = [
  { scene: { type: 'title', overline: 'Téo e Lia explicam SOLID · Aula 03', title: 'Por que trocar o e-mail quebrou o teste do frete', subtitle: 'Dependências: quem conhece quem' }, states: EXPLAINING },
  { scene: { type: 'card', variant: 'objective', title: 'Dependência é uma seta', items: ['A → B: A conhece B (importa, chama ou herda)', 'Se B muda, A pode quebrar', 'A seta mostra quem sofre'], shown: 2 }, states: EXPLAINING },
  { scene: { type: 'quote', text: 'A mudança anda ao contrário da seta.\nDependa do que muda pouco.' }, states: POINTING },
  { scene: { type: 'chart', xAxisLabel: 'tempo', yAxisLabel: 'custo da mudança', curves: ['healthy', 'rotten'] }, states: EXPLAINING },
  {
    scene: {
      type: 'symptoms',
      shown: 3,
      items: [
        { name: 'Rigidez', description: 'Uma mudança pequena puxa outras cinco.' },
        { name: 'Fragilidade', description: 'Mexe aqui, quebra lá longe.' },
        { name: 'Imobilidade', description: 'Nada se reaproveita sem levar o resto junto.' },
        { name: 'Viscosidade', description: 'O jeito certo dá mais trabalho que a gambiarra.' },
      ],
    },
    states: EXPLAINING,
  },
  {
    scene: {
      type: 'code',
      title: 'checkout.ts',
      lines: [
        "import { SmtpEmail } from './smtp';",
        '',
        'export class Checkout {',
        '  constructor(private email: SmtpEmail) {}',
        '',
        '  fechar(pedido: Pedido) {',
        '    const total = calcularFrete(pedido) + 1_000;',
        "    this.email.enviar(pedido.cliente, 'Pedido fechado');",
        '    return total; // em centavos',
        '  }',
        '}',
      ],
      added: [3],
      highlight: ['SmtpEmail'],
    },
    states: POINTING,
  },
  {
    scene: {
      type: 'terminal',
      command: 'npm test -- frete',
      lines: [
        { text: 'FAIL  src/frete.test.ts', tone: 'fail' },
        { text: '  ✕ calcula o frete para o Sul (12 ms)', tone: 'fail' },
        { text: '    Cannot find module ./smtp' },
        { text: 'Tests: 1 failed, 12 passed, 13 total', tone: 'ok' },
      ],
    },
    states: EXPLAINING,
  },
  {
    scene: {
      type: 'graph',
      nodes: [
        { id: 'checkout', label: 'Checkout', x: 22, y: 25, tone: 'core' },
        { id: 'frete', label: 'Regra de frete', x: 75, y: 25, tone: 'soft' },
        { id: 'email', label: 'Provedor de e-mail', x: 22, y: 75, tone: 'infrastructure' },
        { id: 'tela', label: 'Tela do pedido', x: 75, y: 75, tone: 'interface' },
      ],
      edges: [{ from: 'checkout', to: 'email', bad: true }, { from: 'checkout', to: 'frete' }, { from: 'tela', to: 'checkout' }],
      focusOnBad: true,
    },
    states: POINTING,
  },
  {
    scene: {
      type: 'versus',
      wrong: { title: 'Checkout conhece o SMTP', text: 'Trocar de provedor\nquebra o checkout e o teste do frete.' },
      right: { title: 'Checkout conhece uma porta', text: 'O provedor muda\ne o checkout nem fica sabendo.' },
    },
    states: EXPLAINING,
  },
  {
    scene: {
      type: 'table',
      title: 'Quem muda junto',
      columns: ['Checkout', 'Frete', 'E-mail', 'Tela'],
      rows: [
        { label: 'Trocar o SMTP', cells: ['✕', '✓', '●', '✓'] },
        { label: 'Nova regra de frete', cells: ['✓', '●', '✓', '✓'] },
        { label: 'Novo botão', cells: ['✓', '✓', '✓', '●'] },
      ],
      highlightedColumn: 0,
    },
    states: EXPLAINING,
  },
  { scene: { type: 'talk' }, states: { lia: { pose: 'wave', expression: 'happy', look: 'other' }, teo: { pose: 'shrug', expression: 'confused', look: 'other' } } },
  { scene: { type: 'house', marks: ['wall', 'tv'] }, states: POINTING },
  { scene: { type: 'inbox', count: 3000, subject: 'Pedido confirmado!', note: 'Cenário simulado para fins didáticos' }, states: POINTING },
];
