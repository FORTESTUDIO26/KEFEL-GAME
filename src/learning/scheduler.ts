// Simple, explicit spaced repetition.
//
// Rules (also shown to the parent in plain words):
// - A new or wrong fact comes back a few questions later in the same round (see session.ts),
//   and a wrong fact is due again right away in the next round.
// - An independent success (no hint, first try) moves the fact one stage up, at most once per day.
//   Stage intervals: 0 → 1 day → 3 → 7 → 14 → 30 days.
// - A hint means "not retrieved independently": the fact moves one stage down and returns tomorrow.
// - A mistake resets the fact to stage 0.
// - Every question gets a number from the profile's question counter (kept across exits and reloads).
//   A correct answer counts as remembering alone ("valid") only if no hint was used, the answer was not
//   visible, and at least GAP_QUESTIONS other questions were answered since the answer was last shown
//   (a study card, "עוד לא זוכרת", a hint or a mistake). Otherwise it is "answered after help".
// - Rest rule: after REST_AFTER valid successes, a fact is not asked again until REST_QUESTIONS
//   questions about OTHER facts have been answered since it was last asked. Both orders (7×8, 8×7)
//   are one fact, so swapping the order never skips the rest.
// - "Remembered well" needs independent successes on at least 3 different days,
//   with the last 3 answers independent and no hint or mistake since.
// - Free practice (when nothing is scheduled) records answers but never pushes a fact further away.
// - "Supported" = she saw the answer (study card, copying it, or pressing "עוד לא זוכרת").
//   It counts as taking part, never as remembering: the fact goes back to stage 0 and returns soon.

import type { FactKey } from './facts';

export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_STAGE = INTERVAL_DAYS.length - 1;
export const MASTERY_DAYS = 3;
export const MASTERY_STREAK = 3;
/** other questions needed between seeing the answer and a try that counts as remembering alone */
export const GAP_QUESTIONS = 2;
/** valid successes after which a fact rests */
export const REST_AFTER = 5;
/** questions about other facts before a resting fact may be asked again */
export const REST_QUESTIONS = 20;
const DAY_LIST_CAP = 60;

export type Outcome = 'independent' | 'hinted' | 'wrong' | 'supported';
export type LearningState = 'new' | 'learning' | 'reviewing' | 'mastered';
export type Orientation = 'ab' | 'ba';

export interface FactStats {
  key: FactKey;
  attempts: number;
  correct: number;
  wrong: number;
  hintUses: number;
  independentCorrect: number;
  hintedCorrect: number;
  /** correct without seeing the answer, but on a day she already had help with it */
  afterHelpCorrect: number;
  /** practised with the answer shown (study, copying, "עוד לא זוכרת") */
  supported: number;
  /** consecutive independent successes */
  streak: number;
  stage: number;
  lastPracticed: number | null;
  nextDue: number | null;
  state: LearningState;
  /** distinct days with an independent success since the last mistake/hint */
  cleanDays: string[];
  /** all distinct days with an independent success (capped) */
  independentDays: string[];
  /** how often each display order was asked (a×b with a<=b is "ab") */
  seenAB: number;
  seenBA: number;
  /** matching-game exposures: practice only, never counted as recall */
  recognition: number;
  /** last day she got help with this fact (mistake, hint, or the answer was shown) */
  lastMissDay: string | null;
  /** question-counter value when this fact was last asked (null: never, or before the counter existed) */
  lastAskedQ: number | null;
  /** question-counter value when its answer was last shown (study, hint, mistake, "עוד לא זוכרת") */
  helpQ: number | null;
}

export const STATE_LABEL: Record<LearningState, string> = {
  new: 'עוד לא תורגל',
  learning: 'בלמידה',
  reviewing: 'מתחזק',
  mastered: 'נזכר היטב',
};

export function emptyStats(key: FactKey): FactStats {
  return {
    key,
    attempts: 0,
    correct: 0,
    wrong: 0,
    hintUses: 0,
    independentCorrect: 0,
    hintedCorrect: 0,
    supported: 0,
    afterHelpCorrect: 0,
    streak: 0,
    stage: 0,
    lastPracticed: null,
    nextDue: null,
    state: 'new',
    cleanDays: [],
    independentDays: [],
    seenAB: 0,
    seenBA: 0,
    recognition: 0,
    lastMissDay: null,
    lastAskedQ: null,
    helpQ: null,
  };
}

// ---------- dates (local time) ----------

export function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ms: number, days: number): number {
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() + days);
  return d.getTime();
}

// ---------- state ----------

export function computeState(s: FactStats): LearningState {
  if (s.attempts === 0) return 'new';
  if (s.cleanDays.length >= MASTERY_DAYS && s.streak >= MASTERY_STREAK) return 'mastered';
  if (s.independentCorrect > 0 && s.cleanDays.length >= 1 && s.stage >= 1) return 'reviewing';
  return 'learning';
}

export function isDue(s: FactStats, now: number): boolean {
  return s.attempts > 0 && s.nextDue !== null && s.nextDue <= now;
}

/** Facts the game can treat as "she knows this" (used to choose hints). */
export function isKnown(s: FactStats | undefined): boolean {
  return !!s && (s.state === 'reviewing' || s.state === 'mastered');
}

export interface RecordOptions {
  orientation: Orientation;
  usedHint: boolean;
  /** free practice: record, but never push the fact further away */
  free?: boolean;
  /**
   * This question's number in the profile's question counter. Omit for exposure only
   * (the answer was shown without a question, e.g. copying from a study card); then
   * `helpAt` is the counter value at that moment.
   */
  q?: number;
  helpAt?: number;
  /** the answer was shown without a question (copying from a study card, a trick) */
  exposure?: boolean;
}

/** Would a correct answer to question number q count as remembering alone? */
export function isValidRecall(s: FactStats, q: number, usedHint: boolean): boolean {
  return !usedHint && (s.helpQ === null || q - s.helpQ > GAP_QUESTIONS);
}

/** How many more questions about other facts are needed before this resting fact may be asked. */
export function restRemaining(s: FactStats, questionCount: number): number {
  if (s.independentCorrect < REST_AFTER || s.lastAskedQ === null) return 0;
  return Math.max(0, REST_QUESTIONS - (questionCount - s.lastAskedQ));
}

function addDay(list: string[], day: string): string[] {
  if (list.includes(day)) return list;
  const next = [...list, day];
  return next.length > DAY_LIST_CAP ? next.slice(next.length - DAY_LIST_CAP) : next;
}

/**
 * Record one answered question. Outcome must already reflect hints:
 * a correct answer after a hint is 'hinted', never 'independent'.
 */
export function recordOutcome(prev: FactStats, outcome: Outcome, now: number, opts: RecordOptions): FactStats {
  if (outcome === 'independent' && opts.usedHint) {
    throw new Error('independent outcome cannot use a hint');
  }
  const s: FactStats = { ...prev, cleanDays: [...prev.cleanDays], independentDays: [...prev.independentDays] };
  const today = dayKey(now);
  const tomorrow = addDays(now, 1);

  s.attempts += 1;
  s.lastPracticed = now;
  if (opts.orientation === 'ab') s.seenAB += 1;
  else s.seenBA += 1;
  if (opts.usedHint) s.hintUses += 1;
  const asked = opts.q !== undefined;
  // Saves from before the counter existed: help earlier today means the answer was just seen.
  const helpQ = s.helpQ ?? (s.lastMissDay === today && asked ? opts.q! - 1 : null);
  // Without a question number (older callers), help earlier today makes a correct answer "after help".
  const valid = asked
    ? !opts.usedHint && (s.lastMissDay !== today || isValidRecall({ ...s, helpQ }, opts.q!, opts.usedHint))
    : !opts.exposure && s.lastMissDay !== today;
  if (asked) s.lastAskedQ = opts.q!;
  if (outcome !== 'independent') s.helpQ = asked ? opts.q! : (opts.helpAt ?? s.helpQ);

  if (outcome === 'independent' && !valid) {
    // Too soon after the answer was shown (or answered without a numbered question): good, but it is
    // an answer after help — not remembering alone. It only confirms the fact for tomorrow.
    s.correct += 1;
    s.afterHelpCorrect += 1;
    if (s.nextDue === null || s.nextDue <= now) s.nextDue = tomorrow;
  } else if (outcome === 'independent') {
    s.correct += 1;
    s.independentCorrect += 1;
    s.streak += 1;
    s.cleanDays = addDay(s.cleanDays, today);
    if (!opts.free) {
      const firstToday = !s.independentDays.includes(today);
      s.independentDays = addDay(s.independentDays, today);
      if (firstToday) {
        s.stage = Math.min(s.stage + 1, MAX_STAGE);
        s.nextDue = addDays(now, Math.max(1, INTERVAL_DAYS[s.stage]));
      } else {
        // Same-day repeats never count as an extra spaced success.
        s.nextDue = Math.max(s.nextDue ?? 0, tomorrow);
      }
    } else {
      s.independentDays = addDay(s.independentDays, today);
      if (s.nextDue === null) s.nextDue = tomorrow;
    }
  } else if (outcome === 'hinted') {
    s.correct += 1;
    s.hintedCorrect += 1;
    s.streak = 0;
    s.cleanDays = [];
    s.lastMissDay = today;
    if (!opts.free) s.stage = Math.max(0, s.stage - 1);
    // Back tomorrow (it also returns later in today's round): shorter than any earned interval.
    s.nextDue = tomorrow;
  } else if (outcome === 'supported') {
    s.supported += 1;
    s.streak = 0;
    s.cleanDays = [];
    s.lastMissDay = today;
    s.stage = 0;
    // Due again soon (the next session or client); never pushed into the future.
    s.nextDue = s.nextDue === null ? now : Math.min(s.nextDue, now);
  } else {
    s.wrong += 1;
    s.streak = 0;
    s.cleanDays = [];
    s.lastMissDay = today;
    s.stage = 0;
    s.nextDue = now;
  }

  s.state = computeState(s);
  return s;
}

/** Matching-game exposure: counted as practice, never as recall. */
export function recordRecognition(prev: FactStats): FactStats {
  return { ...prev, recognition: prev.recognition + 1 };
}
