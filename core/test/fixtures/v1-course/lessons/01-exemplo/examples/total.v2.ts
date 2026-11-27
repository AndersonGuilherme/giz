export function total(items: number[], discount = 0): number {
  const sum = items.reduce((sum, item) => sum + item, 0);
  return sum - discount;
}
