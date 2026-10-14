// Multiplication facts 1–10. A fact and its reverse (7×8 / 8×7) share one record,
// keyed by the canonical "small x big" form; the display orientation is chosen per question.

export type FactKey = string;

export function factKey(a: number, b: number): FactKey {
  return a <= b ? `${a}x${b}` : `${b}x${a}`;
}

export function parseKey(key: FactKey): [number, number] {
  const [a, b] = key.split('x').map(Number);
  return [a, b];
}

export const ALL_KEYS: FactKey[] = (() => {
  const keys: FactKey[] = [];
  for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) keys.push(factKey(a, b));
  return keys;
})();

export function isValidKey(key: string): boolean {
  return ALL_KEYS.includes(key);
}

/** Facts whose table is in the chosen range (either factor counts). */
export function keysInRange(tables: number[]): FactKey[] {
  const set = new Set(tables);
  return ALL_KEYS.filter((k) => {
    const [a, b] = parseKey(k);
    return set.has(a) || set.has(b);
  });
}

/**
 * Rough difficulty 1–5. Facts with 1, 2, 10 are easiest; facts where both
 * factors are 6–9 are hardest — these get extra emphasis.
 */
export function difficulty(key: FactKey): number {
  const [a, b] = parseKey(key);
  if (a === 1) return 1;
  if (b === 10 || a === 10) return 1.5;
  if (a === 2) return 1.5;
  if (a === 5 || b === 5) return 2;
  if (a <= 4 && b <= 4) return 2;
  if (a >= 6 && b >= 6) return a === b ? 4 : 5;
  if (b >= 6) return a === 3 ? 3 : 3.5;
  return 3;
}

export const HARD_THRESHOLD = 3.5;
