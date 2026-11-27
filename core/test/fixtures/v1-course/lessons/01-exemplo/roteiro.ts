// A small v1 lesson (the old motor format) for the converter tests.
import type { V1Lesson } from '../../../../../src/infrastructure/v1/v1Lesson.ts';

export const lesson: V1Lesson = {
  course: 'teste',
  number: '01',
  slug: 'exemplo',
  title: 'O checkout que somava errado',
  chapters: ['O problema', 'A correção'],
  cues: [
    { id: '001', chapter: 1, speaker: 'teo', expr: 'concerned', pose: 'raise', look: 'viewer', react: { expr: 'thinking' },
      scene: { kind: 'inbox', count: 0, subject: 'Pedido confirmado!', note: 'Cenário simulado' },
      text: 'O checkout [mandou] três mil e-mails.', beats: [{ count: 3000, sfx: 'error' }] },
    { id: '002', chapter: 1, speaker: 'lia', expr: 'thinking', pose: 'think', react: { expr: 'concerned' },
      scene: { kind: 'code', file: 'total.v1.ts', title: 'total.ts' }, text: 'Esse é o cálculo do total.' },
    { id: '003', chapter: 2, speaker: 'lia', expr: 'happy', pose: 'point', react: { expr: 'happy' }, read: 3,
      scene: { kind: 'code', file: 'total.v2.ts', title: 'total.ts', diffAgainst: 'total.v1.ts', highlight: ['discount'] },
      text: 'Agora o desconto entra [aqui].', beats: [{ highlight: ['sum - discount'], sfx: 'pop' }] },
    { id: '004', chapter: 2, speaker: 'teo', expr: 'excited', pose: 'celebrate', react: { expr: 'happy' }, set: { highlight: [] },
      text: 'E o total <pausa 0.3> volta a bater.' },
  ],
};
