// Black Friday da loja: de 24 a 30 de novembro (mesma regra das aulas anteriores).
export function isBlackFriday(date: Date): boolean {
  return date.getMonth() === 10 && date.getDate() >= 24 && date.getDate() <= 30;
}
