// Coins, purchases and rewards. Coins are only earned in the game and never taken away for mistakes.

import { RARE_ITEMS,priceOf, wearableById, type Direction, type ShopKind } from '../content/catalog';
import { dayKey } from '../learning/scheduler';
import type { Outcome } from '../learning/scheduler';
import type { RoundMode } from '../learning/session';
import type { Outfit, SaveData } from './types';

export const ROUND_COINS = 50;
export const INDEPENDENT_COIN = 1;
export const STYLE_COIN_PER_STAR = 2;

/** Persistence rewards count practice days in total — never consecutive streaks. */
export const PRACTICE_MILESTONES: { days: number; coins: number }[] = [
  { days: 2, coins: 20 },
  { days: 4, coins: 25 },
  { days: 7, coins: 30 },
  { days: 10, coins: 35 },
  { days: 15, coins: 40 },
  { days: 20, coins: 45 },
  { days: 30, coins: 50 },
  { days: 45, coins: 55 },
  { days: 60, coins: 60 },
];

function ownedKey(kind: ShopKind): keyof SaveData['owned'] {
  return kind === 'wearable' ? 'wearables' : kind === 'furniture' ? 'furniture' : 'backgrounds';
}

export function isOwned(save: SaveData, kind: ShopKind, id: string): boolean {
  return save.owned[ownedKey(kind)].includes(id);
}

export type BuyCheck =
  | { ok: true; price: number }
  | { ok: false; reason: 'unknown' | 'owned' | 'rewardOnly' }
  | { ok: false; reason: 'coins'; missing: number };

export function canBuy(save: SaveData, kind: ShopKind, id: string): BuyCheck {
  const price = priceOf(kind, id);
  if (price === undefined) return { ok: false, reason: 'unknown' };
  if (isOwned(save, kind, id)) return { ok: false, reason: 'owned' };
  if(RARE_ITEMS.some(r=>r.kind===kind&&r.id===id))return {ok:false,reason:'rewardOnly'};
  if (save.coins < price) return { ok: false, reason: 'coins', missing: price - save.coins };
  return { ok: true, price };
}

/** Returns the same object when the purchase is not allowed (no double purchase, no debt). */
export function buy(save: SaveData, kind: ShopKind, id: string): { save: SaveData; check: BuyCheck } {
  const check = canBuy(save, kind, id);
  if (!check.ok) return { save, check };
  const key = ownedKey(kind);
  return {
    save: {
      ...save,
      coins: save.coins - check.price,
      owned: { ...save.owned, [key]: [...save.owned[key], id] },
    },
    check,
  };
}

export interface RoundReward {
  base: number;
  independentBonus: number;
  total: number;
}

/** Every completed mission pays 50 coins, including supported and free practice. */
export function roundReward(_outcomes: Outcome[], _mode: RoundMode): RoundReward {
 return {base:ROUND_COINS,independentBonus:0,total:ROUND_COINS};
}

export function addCoins(save: SaveData, amount: number): SaveData {
  if (amount <= 0) return save;
  return { ...save, coins: save.coins + amount, totalEarned: save.totalEarned + amount };
}

/** Record that a round was finished today and pay any practice-day milestones reached. */
export function registerPracticeDay(save: SaveData, now: number): { save: SaveData; milestone: { days: number; coins: number } | null } {
  const today = dayKey(now);
  const practiceDays = save.progress.practiceDays.includes(today)
    ? save.progress.practiceDays
    : [...save.progress.practiceDays, today].slice(-60);
  // The list keeps the last 60 days, which covers the largest milestone.
  const count = practiceDays.length;
  const next = PRACTICE_MILESTONES.find((m) => m.days <= count && !save.progress.milestonesClaimed.includes(m.days));
  let out: SaveData = { ...save, progress: { ...save.progress, practiceDays } };
  if (next) {
    out = addCoins(out, next.coins);
    out = { ...out, progress: { ...out.progress, milestonesClaimed: [...out.progress.milestonesClaimed, next.days] } };
  }
  return { save: out, milestone: next ?? null };
}

/** 0–3 stars for how well a look matches the chosen style direction. Never blocks anything. */
export function styleStars(outfit: Outfit, direction: Direction | null): number {
  if (!direction) return 0;
  let matches = 0;
  for (const piece of Object.values(outfit)) {
    const item = piece && wearableById(piece.itemId);
    if (item && item.tags.some((t) => direction.tags.includes(t))) matches += 1;
  }
  return Math.min(3, matches);
}
