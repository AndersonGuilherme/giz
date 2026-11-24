/** A four-point sparkle star of radius `size` centered at (`x`, `y`) (the motor's emblem and eye sparkle). */
export function starPath(x: number, y: number, size: number): string {
  const center = `${x},${y}`;
  return `M${x},${y - size} Q${center} ${x + size},${y} Q${center} ${x},${y + size} Q${center} ${x - size},${y} Q${center} ${x},${y - size}Z`;
}
