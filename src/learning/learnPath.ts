// "לומדות וזוכרות" — teach first, then ask.
//
// - Each session works on the same six facts (a "set"), in three pairs.
// - Day check: every fact that was practised on an earlier day — even one that was only learned with
//   help — is first asked gently at the start of the session, before any answer is shown.
//   "עוד לא זוכרת" is available at once, with no timer and no penalty.
// - A fact remembered in the day check needs no teaching today. A fact that needed help in the check,
//   and every brand-new fact, goes through the supported learning: shown with its answer (say it
//   aloud, practise with the answer visible), then a short design action, then a try without the answer.
// - Any help (the answer shown, a calculation hint, a mistake) brings the fact back later in the
//   same session, after other activities — at most twice. An answer after help is never counted as
//   remembering alone.
// - New facts join the set only when earlier ones were remembered alone on 2 different days, only if
//   the last session went reasonably well, and only while the other facts are not still hard.
//   Otherwise the same six facts stay, with more support.

import type { LearningData } from './data';
import { emptyDaily, getStats } from './data';
import { difficulty, keysInRange, parseKey, type FactKey } from './facts';
import { dayKey, type FactStats, type Outcome } from './scheduler';

export const SET_SIZE = 6;
/** a fact leaves the set after being remembered alone on this many different days */
export const GRADUATE_DAYS = 2;
export const MAX_NEW_PER_SESSION = 2;
export const MAX_RETRIES = 2;
/** below this share of answers remembered alone, the set stays the same and support increases */
export const STRUGGLE_RATIO = 0.5;

export type DesignSlot = 'body' | 'neck' | 'head' | 'feet' | 'prop';
const DESIGN_SLOTS: DesignSlot[] = ['body', 'neck', 'head', 'feet'];

export type LearnStep =
  | { type: 'study'; id: string; pair: FactKey[] }
  | { type: 'design'; id: string; slot: DesignSlot; /** skipped when every fact of this pair passed the day check */ forPair?: FactKey[] }
  | { type: 'recall'; id: string; key: FactKey; a: number; b: number; retry: boolean; /** day check, before any answer is shown */ check?: boolean }
  | { type: 'finish'; id: string };

export interface LearnSession {
  id: string;
  startedAt: number;
  keys: FactKey[];
  pairs: FactKey[][];
  /** extra support: calculation tips are shown right away */
  extraSupport: boolean;
  /** facts remembered alone in today's day check — they skip today's teaching */
  checkedOk: FactKey[];
  steps: LearnStep[];
  index: number;
  retries: Record<FactKey, number>;
  /** recall answers this session: remembered alone / correct after help / needed help */
  alone: number;
  afterHelp: number;
  helped: number;
  /** day-check answers (memory from an earlier day) — the measure for "is she struggling?" */
  checkAlone: number;
  checkTotal: number;
  /** the recall step that was already answered (so a resumed session moves past it) */
  answeredStepId: string | null;
  /** design choices: slot → item id */
  look: Partial<Record<DesignSlot, string>>;
}

export interface LearnSessionResult {
  day: string;
  alone: number;
  total: number;
}

export type Rng = () => number;

let counter = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(counter += 1)}`;

function shuffled<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Ask before showing: the fact was practised before (on an earlier day — a fact first met today
 * always came with its answer shown) and she has not seen its answer or had help with it today.
 */
export function needsDayCheck(s: FactStats, today: string): boolean {
  return s.attempts > 0 && s.lastMissDay !== today;
}

/** Still hard: not remembered alone on any day since the last help. */
export function stillHard(s: FactStats): boolean {
  return s.cleanDays.length === 0;
}

export function isGraduated(s: FactStats): boolean {
  return s.cleanDays.length >= GRADUATE_DAYS;
}

export function lastResultStruggling(data: LearningData): boolean {
  const last = data.learnLog[data.learnLog.length - 1];
  return !!last && last.total > 0 && last.alone / last.total < STRUGGLE_RATIO;
}

/** Order for introducing new facts: start just above the very easy ones, hard facts later. */
export function newFactOrder(keys: FactKey[], data: LearningData): FactKey[] {
  const rank = (k: FactKey) => {
    const d = difficulty(k);
    return d <= 1.5 ? 10 + d : d; // ×1 / ×2 / ×10 facts come last: she can work those out
  };
  return [...keys].sort((x, y) => {
    // facts that already caused trouble first
    const tx = getStats(data, x).wrong + getStats(data, x).hintedCorrect + getStats(data, x).supported;
    const ty = getStats(data, y).wrong + getStats(data, y).hintedCorrect + getStats(data, y).supported;
    return ty - tx || rank(x) - rank(y) || x.localeCompare(y);
  });
}

/**
 * The six facts for the next session.
 * Keeps the current set; replaces facts that were remembered alone on 2 different days
 * (at most 2 per session), but only when the last session was not a struggle and at most two of
 * the other facts are still hard. Otherwise the remembered facts stay for review, so there are
 * always six facts and nothing new is added just to fill a quota.
 */
export function chooseLearnSet(data: LearningData, tables: number[]): FactKey[] {
  const range = keysInRange(tables.length ? tables : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const st = (k: FactKey) => getStats(data, k);
  let set = data.learnSet.filter((k) => range.includes(k));
  const struggling = lastResultStruggling(data);

  const othersHard = set.filter((k) => !isGraduated(st(k)) && stillHard(st(k))).length;
  if (!struggling && othersHard <= 2) {
    let replaced = 0;
    set = set.filter((k) => {
      if (replaced < MAX_NEW_PER_SESSION && isGraduated(st(k))) {
        replaced += 1;
        return false;
      }
      return true;
    });
  }

  if (set.length < SET_SIZE) {
    // Fill: not yet well remembered, preferring ones that caused trouble, then gradually harder ones.
    const candidates = range.filter((k) => !set.includes(k) && !isGraduated(st(k)) && st(k).state !== 'mastered');
    const pool = candidates.length >= SET_SIZE - set.length ? candidates : range.filter((k) => !set.includes(k));
    // With a brand-new set everything is new; otherwise add at most MAX_NEW_PER_SESSION.
    const room = data.learnSet.length === 0 ? SET_SIZE - set.length : Math.min(SET_SIZE - set.length, MAX_NEW_PER_SESSION);
    set = [...set, ...newFactOrder(pool, data).slice(0, room)];
  }
  return set.slice(0, SET_SIZE);
}

/** Pairs of related facts (same smaller factor next to each other). */
export function pairUp(keys: FactKey[]): FactKey[][] {
  const sorted = [...keys].sort((x, y) => {
    const [a1, b1] = parseKey(x);
    const [a2, b2] = parseKey(y);
    return a1 - a2 || b1 - b2;
  });
  const pairs: FactKey[][] = [];
  for (let i = 0; i < sorted.length; i += 2) pairs.push(sorted.slice(i, i + 2));
  return pairs;
}

function recallStep(key: FactKey, s: FactStats, retry: boolean, rng: Rng, check = false): LearnStep {
  const [x, y] = parseKey(key);
  // practise both orders: the one seen less often, or at random
  const flip = x !== y && (s.seenAB > s.seenBA || (s.seenAB === s.seenBA && rng() < 0.5));
  const [a, b] = flip ? [y, x] : [x, y];
  return check ? { type: 'recall', id: uid('c'), key, a, b, retry, check: true } : { type: 'recall', id: uid('r'), key, a, b, retry };
}

/** Steps that are skipped for facts remembered in today's day check. */
export function isSkipped(session: LearnSession, step: LearnStep): boolean {
  const ok = session.checkedOk;
  if (step.type === 'study') return step.pair.every((k) => ok.includes(k));
  if (step.type === 'design') return !!step.forPair && step.forPair.every((k) => ok.includes(k));
  if (step.type === 'recall') return !step.check && !step.retry && ok.includes(step.key);
  return false;
}

/** The facts of a study step that still need teaching today. */
export function factsToTeach(session: LearnSession, step: Extract<LearnStep, { type: 'study' }>): FactKey[] {
  return step.pair.filter((k) => !session.checkedOk.includes(k));
}

export function buildLearnSession(data: LearningData, keys: FactKey[], now: number, rng: Rng = Math.random): LearnSession {
  const today = dayKey(now);
  const extraSupport = lastResultStruggling(data);
  const pairs = pairUp(keys);
  const steps: LearnStep[] = [];
  // 1. Day check: facts from earlier days are asked before anything is shown.
  for (const k of shuffled(keys.filter((k) => needsDayCheck(getStats(data, k), today)), rng)) {
    steps.push(recallStep(k, getStats(data, k), false, rng, true));
  }
  // 2. Supported learning, pair by pair (facts remembered in the check are skipped at run time).
  pairs.forEach((pair, i) => {
    steps.push({ type: 'study', id: uid('s'), pair });
    steps.push({ type: 'design', id: uid('d'), slot: DESIGN_SLOTS[i % DESIGN_SLOTS.length], forPair: pair });
    for (const k of shuffled(pair, rng)) steps.push(recallStep(k, getStats(data, k), false, rng));
  });
  steps.push({ type: 'finish', id: uid('f') });
  return {
    id: uid('L'),
    startedAt: now,
    keys,
    pairs,
    extraSupport,
    steps,
    index: 0,
    retries: {},
    alone: 0,
    afterHelp: 0,
    helped: 0,
    checkAlone: 0,
    checkTotal: 0,
    answeredStepId: null,
    checkedOk: [],
    look: {},
  };
}

/**
 * After a recall answer: count it, and if she needed help, bring the fact back later —
 * after the next design action and the questions that follow it (or a new short design
 * action at the end), so it is never asked right after the answer was shown.
 */
export function afterLearnAnswer(session: LearnSession, index: number, outcome: Outcome, afterHelp = false): LearnSession {
  const step = session.steps[index];
  if (!step || step.type !== 'recall' || session.answeredStepId === step.id) return session;
  const s: LearnSession = {
    ...session,
    steps: [...session.steps],
    retries: { ...session.retries },
    alone: session.alone + (outcome === 'independent' && !afterHelp ? 1 : 0),
    afterHelp: session.afterHelp + (outcome === 'independent' && afterHelp ? 1 : 0),
    helped: session.helped + (outcome === 'independent' ? 0 : 1),
    checkAlone: session.checkAlone + (step.check && outcome === 'independent' ? 1 : 0),
    checkTotal: session.checkTotal + (step.check ? 1 : 0),
    answeredStepId: step.id,
  };
  if (step.check) {
    // Remembered in the day check: no teaching today. Otherwise the pair's supported learning follows.
    if (outcome === 'independent') s.checkedOk = [...s.checkedOk, step.key];
    return s;
  }
  if (outcome === 'independent') return s;
  const done = s.retries[step.key] ?? 0;
  if (done >= MAX_RETRIES) return s;
  s.retries[step.key] = done + 1;

  // The retry uses the other order, so both forms of the fact get practised.
  const retry: LearnStep = { type: 'recall', id: uid('r'), key: step.key, a: step.b, b: step.a, retry: true };
  // After the next design action and the recall questions that follow it.
  const nextDesign = s.steps.findIndex((x, i) => i > index && x.type === 'design' && !isSkipped(s, x));
  if (nextDesign >= 0) {
    let pos = nextDesign + 1;
    while (pos < s.steps.length && s.steps[pos].type === 'recall') pos += 1;
    s.steps.splice(pos, 0, retry);
  } else {
    // At the end: a short design action first, then the retry, then finish.
    const finishIdx = s.steps.findIndex((x) => x.type === 'finish');
    const at = finishIdx >= 0 ? finishIdx : s.steps.length;
    const others = s.steps.slice(index + 1, at).filter((x) => x.type === 'recall').length;
    const insert: LearnStep[] = others >= 2 ? [retry] : [{ type: 'design', id: uid('d'), slot: 'prop' }, retry];
    s.steps.splice(at, 0, ...insert);
  }
  return s;
}

/** First step at or after `from` that is not skipped (the finish step is never skipped). */
export function nextActiveIndex(session: LearnSession, from: number): number {
  let i = from;
  while (i < session.steps.length - 1 && isSkipped(session, session.steps[i])) i += 1;
  return i;
}

export function finishLearnLog(data: LearningData, session: LearnSession, now: number): LearningData {
  const day = dayKey(now);
  // Only the day check shows what was remembered from an earlier day.
  const log = { ...(data.daily[day] ?? emptyDaily()) };
  log.learnSessions += 1;
  return {
    ...data,
    learnSession: null,
    learnLog: [...data.learnLog, { day, alone: session.checkAlone, total: session.checkTotal }].slice(-20),
    daily: { ...data.daily, [day]: log },
  };
}

/** Coins for taking part — the same whether she remembered alone or needed help. */
export function learnReward(session: LearnSession): number {
  return 15 + Math.min(10, session.alone + session.afterHelp + session.helped);
}

// ---------- saying numbers aloud ----------

const UNITS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
const TEENS = ['עשר', 'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה'];
const TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];

/** Numbers 0–100 in words, the way they are counted aloud. */
export function hebrewNumber(n: number): string {
  if (n === 0) return 'אפס';
  if (n === 100) return 'מאה';
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? TENS[t] : `${TENS[t]} ו${UNITS[u]}`;
}

export function sayAloud(a: number, b: number): string {
  return `${hebrewNumber(a)} כפול ${hebrewNumber(b)} שווה ${hebrewNumber(a * b)}`;
}
