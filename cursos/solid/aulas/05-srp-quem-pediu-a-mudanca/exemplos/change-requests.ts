// Cenário simulado para fins didáticos: os pedidos de mudança que o checkout recebeu num trimestre.
// A pergunta do SRP não é "o que a classe faz?", e sim "QUEM pede para ela mudar?".
export type Actor = 'Financeiro' | 'Logística' | 'Comunicação' | 'Jurídico';
export type Section = 'soma e desconto' | 'frete' | 'gravação' | 'e-mail';
export type ChangeRequest = { request: string; actor: Actor; section: Section };

export const changeRequests: ChangeRequest[] = [
  { request: 'VIP: de 5% para 10%', actor: 'Financeiro', section: 'soma e desconto' },
  { request: 'Black Friday: 20%, não acumula', actor: 'Financeiro', section: 'soma e desconto' },
  { request: 'Frete grátis a partir de R$ 200', actor: 'Logística', section: 'frete' },
  { request: 'Expresso: de R$ 30 para R$ 35', actor: 'Logística', section: 'frete' },
  { request: 'E-mail mostra a economia', actor: 'Comunicação', section: 'e-mail' },
  { request: 'Valores no formato R$ 0,00', actor: 'Comunicação', section: 'e-mail' },
  { request: 'Gravar só o id do cliente (LGPD)', actor: 'Jurídico', section: 'gravação' },
  { request: 'Gravar o total com frete', actor: 'Jurídico', section: 'gravação' },
];

export function byActor(changes: ChangeRequest[]) {
  const groups = new Map<Actor, { count: number; sections: Set<Section> }>();
  for (const c of changes) {
    const g = groups.get(c.actor) ?? { count: 0, sections: new Set<Section>() };
    g.count++;
    g.sections.add(c.section);
    groups.set(c.actor, g);
  }
  return groups;
}

export function actorsPerSection(changes: ChangeRequest[]) {
  const actors = new Map<Section, Set<Actor>>();
  for (const c of changes) actors.set(c.section, (actors.get(c.section) ?? new Set<Actor>()).add(c.actor));
  return actors;
}
