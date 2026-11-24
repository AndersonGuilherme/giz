// Black Friday da loja: de 24 a 30 de novembro (mesma regra das aulas anteriores).
export function isBlackFriday(date: Date): boolean {
  return date.getMonth() === 10 && date.getDate() >= 24 && date.getDate() <= 30;
}

// Data local no formato AAAA-MM-DD (para comparar com as datas da tabela de promoções).
const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
