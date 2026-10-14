function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

/** amount > 0 lightens towards white, < 0 darkens towards black. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex);
  if (amount >= 0) return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  const k = 1 + amount;
  return toHex(r * k, g * k, b * k);
}

export function isLight(hex: string): boolean {
  const [r, g, b] = parse(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

export const INK = '#3b2d4f';
