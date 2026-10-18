// Little surprises that pop up in the room while designing (a gift, a balloon, a star).
// Tapping one gives a few coins. At most MAX_PER_DAY a day, so they stay special and never replace learning.
import type { SaveData } from './types';

export const MAX_SURPRISES_PER_DAY = 3;
export const SURPRISE_COINS = 5;
export const SURPRISE_KINDS = ['gift', 'balloon', 'star'] as const;
export type SurpriseKind = (typeof SURPRISE_KINDS)[number];

export interface SurpriseData { day: string; found: number }

const pad = (n: number) => String(n).padStart(2, '0');
export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function defaultSurprise(): SurpriseData { return { day: '', found: 0 }; }
export function sanitizeSurprise(raw: unknown): SurpriseData {
  if (!raw || typeof raw !== 'object') return defaultSurprise();
  const r = raw as Record<string, unknown>;
  const day = typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) ? r.day : '';
  const found = typeof r.found === 'number' && Number.isSafeInteger(r.found) ? Math.min(Math.max(r.found, 0), MAX_SURPRISES_PER_DAY) : 0;
  return { day, found: day ? found : 0 };
}
/** How many surprises are still waiting today. */
export function surprisesLeft(s: SaveData, now: number): number {
  const d = s.surprise ?? defaultSurprise();
  return d.day === dayKey(now) ? Math.max(0, MAX_SURPRISES_PER_DAY - d.found) : MAX_SURPRISES_PER_DAY;
}
/** Opens one surprise: a few coins; does nothing once today's surprises are used up. */
export function claimSurprise(s: SaveData, now: number): SaveData {
  if (surprisesLeft(s, now) <= 0) return s;
  const today = dayKey(now);
  const d = s.surprise ?? defaultSurprise();
  return {
    ...s,
    coins: s.coins + SURPRISE_COINS,
    totalEarned: s.totalEarned + SURPRISE_COINS,
    surprise: { day: today, found: (d.day === today ? d.found : 0) + 1 },
  };
}
