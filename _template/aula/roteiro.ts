// Roteiro da Aula {{NUMERO}} — fonte única da narração E da animação.
// Gerado por `npm run nova-aula`: é um exemplo COMPLETO que já renderiza. Troque o conteúdo pelo da sua aula.
// Campos e cenas: padrao/como-escrever-uma-aula.md · personagens: personagens/guia-editorial.md
import type { Lesson } from '../../../../motor/src/types.ts';

export const lesson: Lesson = {
  course: '{{CURSO}}',
  number: '{{NUMERO}}',
  slug: '{{SLUG}}',
  title: '{{TITULO}}',
  chapters: ['O desastre', 'O suspeito', 'A pista', 'A lição', 'Desafio'],
  cues: [
    // ── 1 · O desastre: o problema aparece em até 8 s e vira uma pergunta ──
    { id: '001', chapter: 1, speaker: 'teo', expr: 'surprised', pose: 'raise', look: 'viewer', react: { expr: 'concerned' },
      scene: { kind: 'card', variant: 'ticket', title: 'Reclamação #4521', items: ['Usei o cupom BEMVINDO', 'Paguei R$ 10 a mais'], shown: 0 },
      text: 'Um cliente [usou um cupom de desconto]... e [pagou mais caro].',
      beats: [{ shown: 1, sfx: 'pop' }, { shown: 2, sfx: 'error' }] },
    { id: '002', chapter: 1, speaker: 'lia', expr: 'thinking', pose: 'think', look: 'other', react: { expr: 'confused' },
      text: 'Mais caro com desconto? Isso não deveria ser possível.' },
    { id: '003', chapter: 1, speaker: 'lia', expr: 'happy', pose: 'explain', react: { expr: 'excited' },
      scene: { kind: 'title', eyebrow: 'Lia e Téo explicam · Aula {{NUMERO}}', title: '{{TITULO}}', subtitle: 'Um caso para investigar' },
      text: 'Vamos descobrir o que aconteceu.' },

    // ── 2 · O suspeito: o código parece certo ──
    { id: '004', chapter: 2, speaker: 'teo', expr: 'neutral', pose: 'point', react: { expr: 'skeptical' },
      scene: { kind: 'code', file: 'exemplo.ts', from: 'export function', title: 'exemplo.ts' },
      text: 'Esse é o cálculo do preço. Se o cupom for [BEMVINDO], tira dez reais.',
      say: 'Esse é o cálculo do preço. Se o cupom for [bem-vindo], tira dez reais.',
      beats: [{ highlight: ["cupom === 'BEMVINDO'"] }] },
    { id: '005', chapter: 2, speaker: 'lia', expr: 'skeptical', look: 'other', react: { expr: 'happy' },
      scene: { kind: 'terminal', command: 'node --test', lines: [] },
      text: 'E os testes [passam].',
      beats: [{ sfx: 'success', lines: [
        { text: '✔ sem cupom, o preço não muda', tone: 'ok' },
        { text: '✔ cupom BEMVINDO dá R$ 10 de desconto', tone: 'ok' },
        { text: 'ℹ tests 2   ℹ pass 2   ℹ fail 0', tone: 'muted' },
      ] }] },

    // ── 3 · A pista: o aluno tenta achar antes da revelação ──
    { id: '006', chapter: 3, speaker: 'teo', expr: 'thinking', pose: 'think', look: 'viewer', react: { expr: 'thinking' },
      scene: { kind: 'code', file: 'exemplo.ts', from: 'export function', title: 'exemplo.ts' },
      text: 'Pausa: o que acontece com um pedido de cinco reais?',
      hold: { seconds: 3, label: 'Ache o bug' }, read: false },
    { id: '007', chapter: 3, speaker: 'lia', expr: 'surprised', pose: 'point', react: { expr: 'surprised' },
      text: '[Cinco menos dez] dá menos cinco. Um preço negativo!',
      beats: [{ highlight: ['subtotal - 10'], sfx: 'error' }] },

    // ── 4 · A lição ──
    { id: '008', chapter: 4, speaker: 'lia', expr: 'happy', pose: 'explain', react: { expr: 'happy' },
      scene: { kind: 'quote', text: 'Teste passando prova o que você testou.\nNão o que você esqueceu.' },
      text: 'Teste passando prova o que você testou. Não o que você esqueceu.' },

    // ── 5 · Desafio + próxima aula ──
    { id: '009', chapter: 5, speaker: 'teo', expr: 'excited', pose: 'point', look: 'viewer', react: { expr: 'happy' },
      scene: { kind: 'card', variant: 'challenge', title: 'Desafio', items: ['Escreva o teste do pedido de R$ 5', 'Corrija o preço para nunca ficar negativo'], shown: 0 },
      text: 'Desafio: [escreva o teste] e [corrija o código].',
      beats: [{ shown: 1, sfx: 'pop' }, { shown: 2, sfx: 'pop' }] },
    { id: '010', chapter: 5, speaker: 'lia', expr: 'excited', pose: 'wave', look: 'viewer', react: { expr: 'excited', pose: 'wave', look: 'viewer' },
      scene: { kind: 'talk' },
      text: 'Até a próxima!' },
  ],
};
