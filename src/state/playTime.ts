// Balance between designing and learning, per profile (it lives in that profile's save).
// Active time in design and free room play is counted only while the page is visible, the child
// is in the studio / wardrobe, and there was a touch or key press in the last IDLE_MS.
// After the limit the design is kept and a short learning session opens another period.
import type { SaveData } from './types';

export interface PlayTime {
  /**
   * active design / free-play time counted against the current allowance. A finished lesson subtracts
   * one period, so it can go below 0: the time left is then more than one period (time is added, not reset).
   */
  usedMs: number;
  /** minutes per period; 0 = no limit (parents can switch it off) */
  limitMin: number;
  /** the "5 minutes left" note was shown in this period */
  warned: boolean;
}

/** 10 minutes of free design, then a short lesson opens another 10 (Sharon's choice, 2026-10-18) */
export const DEFAULT_LIMIT_MIN = 10;
export const LIMIT_CHOICES = [10, 15, 20, 30, 0];
/** the gentle "almost time" note */
export const WARN_BEFORE_MS = 2 * 60_000;
/** no touch or key press for this long → not counted */
export const IDLE_MS = 90_000;
/** one tick never adds more than this (the page may have been asleep) */
export const MAX_TICK_MS = 15_000;

export function defaultPlayTime(): PlayTime {
  return { usedMs: 0, limitMin: DEFAULT_LIMIT_MIN, warned: false };
}

export function playStatus(pt: PlayTime): { limited: boolean; remainingMs: number; warn: boolean; locked: boolean } {
  if (pt.limitMin <= 0) return { limited: false, remainingMs: Infinity, warn: false, locked: false };
  const remainingMs = Math.max(0, pt.limitMin * 60_000 - pt.usedMs);
  return { limited: true, remainingMs, warn: remainingMs > 0 && remainingMs <= WARN_BEFORE_MS, locked: remainingMs === 0 };
}

export interface TickContext {
  visible: boolean;
  /** the screen counts as design / free play */
  designing: boolean;
  /** ms since the last touch or key press */
  idleMs: number;
}

/** Add active time, if this moment counts. */
export function tickPlay(save: SaveData, elapsedMs: number, ctx: TickContext): SaveData {
  const pt = save.playTime;
  if (!ctx.visible || !ctx.designing || ctx.idleMs > IDLE_MS || elapsedMs <= 0) return save;
  const st = playStatus(pt);
  if (!st.limited || st.locked) return save;
  const usedMs = Math.min(pt.limitMin * 60_000, pt.usedMs + Math.min(elapsedMs, MAX_TICK_MS));
  return { ...save, playTime: { ...pt, usedMs } };
}

export function markWarned(save: SaveData): SaveData {
  return save.playTime.warned ? save : { ...save, playTime: { ...save.playTime, warned: true } };
}

/** A completed learning session (help counts) ADDS one period of design time to what is left. */
export function grantPlay(save: SaveData): SaveData {
  const pt = save.playTime;
  if (pt.limitMin <= 0) return save;
  return { ...save, playTime: { ...pt, usedMs: pt.usedMs - pt.limitMin * 60_000, warned: false } };
}

export function setPlayLimit(save: SaveData, limitMin: number): SaveData {
  const limit = LIMIT_CHOICES.includes(limitMin) ? limitMin : DEFAULT_LIMIT_MIN;
  return { ...save, playTime: { ...save.playTime, limitMin: limit } };
}
