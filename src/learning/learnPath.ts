// "לומדות וזוכרות" — teach first, then ask.
//
// One table at a time: ×1 and ×2 are not taught (she knows them). New facts come only from the
// current table — the lowest selected table from ×3 up that is not yet memorised (every fact in it
// remembered alone on GRADUATE_DAYS different days) — in order (3×3, 3×4 … 3×10). The next table
// starts only when the current one is memorised; earlier tables keep coming back as spaced reviews.
// Each session works on up to six facts, in three pairs, chosen afresh from the learning data:
//   1. facts a failed room challenge pointed at, and facts not yet remembered alone since the last help
//      ("reinforce"), 2. facts whose spaced review is due, 3. a few new facts — how many depends on how
//      many facts are still on their way (8+ → none, 4–7 → one, fewer → two). A fact remembered alone
//      today, or resting under the 5-successes / 20-questions rule, is never chosen; if that leaves the
//      set short, early reviews and then a few more new facts (always taught first) fill it, and if
//      nothing is left the session is shorter or not offered.
// Inside a session:
// - Day check: a fact practised before, with no help today, is asked first — before any answer is shown.
//   Remembered → no teaching today. "עוד לא זוכרת" is always available, with no timer and no penalty.
// - Teaching, pair by pair: the fact with its answer (say it aloud, practise with the answer visible),
//   a short design action, a first try. That first try comes right after the answer was seen, so it
//   counts as "after help".
// - Planned spaced retry: every fact taught today is asked once more at the end, after the other pairs'
//   questions, so at least GAP_QUESTIONS other questions separate it from the answer. That try can count
//   as remembering alone. A retry that still needs help gets one more later (at most MAX_RETRIES extra).
// - A fact that reaches REST_AFTER valid successes is skipped until REST_QUESTIONS other questions were
//   answered (counted per profile, kept across reloads; 7×8 and 8×7 are one fact).
// - Next-day and later reviews come from the spaced schedule; same-day success never counts as long-term.

import type { LearningData } from './data';
import { emptyDaily, getStats } from './data';
import { difficulty, keysInRange, parseKey, type FactKey } from './facts';
import { addDays, dayKey, GAP_QUESTIONS, REST_AFTER, REST_QUESTIONS, restRemaining, type FactStats, type Outcome } from './scheduler';

export const SET_SIZE = 6;
/** a fact counts as "on its way" until it was remembered alone on this many different days */
export const GRADUATE_DAYS = 2;
export const MAX_NEW_PER_SESSION = 2;
/** extra retries (beyond the planned one) per fact in a session */
export const MAX_RETRIES = 1;
/** below this share of day-check answers remembered alone, no new facts and extra support */
export const STRUGGLE_RATIO = 0.5;

export type DesignSlot = 'body' | 'neck' | 'head' | 'feet' | 'prop';
const DESIGN_SLOTS: DesignSlot[] = ['body', 'neck', 'head', 'feet'];

export type LearnStep =
  | { type: 'study'; id: string; pair: FactKey[] }
  | { type: 'design'; id: string; slot: DesignSlot; /** skipped when every one of these facts needs nothing more today */ forPair?: FactKey[] }
  | {
      type: 'recall';
      id: string;
      key: FactKey;
      a: number;
      b: number;
      retry: boolean;
      /** day check, before any answer is shown */
      check?: boolean;
      /** the planned spaced retry for a fact taught today */
      planned?: boolean;
    }
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
  /** facts remembered alone (a valid try) at some point in this session */
  aloneKeys: FactKey[];
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
 * Ask before showing: the fact was practised before, she has not seen its answer or had help with it
 * today, and she has not already remembered it alone today.
 */
export function needsDayCheck(s: FactStats, today: string): boolean {
  return s.attempts > 0 && s.lastMissDay !== today && !s.cleanDays.includes(today);
}

/** Still hard: not remembered alone on any day since the last help. */
export function stillHard(s: FactStats): boolean {
  return s.cleanDays.length === 0;
}

export function isGraduated(s: FactStats): boolean {
  return s.cleanDays.length >= GRADUATE_DAYS;
}

/** Resting under the 5-successes / 20-questions rule. */
export function isResting(data: LearningData, key: FactKey): boolean {
  return restRemaining(getStats(data, key), data.questionCount) > 0;
}

export function lastResultStruggling(data: LearningData): boolean {
  const last = data.learnLog[data.learnLog.length - 1];
  return !!last && last.total > 0 && last.alone / last.total < STRUGGLE_RATIO;
}

const trouble = (s: FactStats) => s.wrong + s.hintedCorrect + s.supported;

/** Order for introducing new facts: start just above the very easy ones, hard facts later. */
export function newFactOrder(keys: FactKey[], data: LearningData): FactKey[] {
  const rank = (k: FactKey) => {
    const d = difficulty(k);
    return d <= 1.5 ? 10 + d : d; // ×1 / ×2 / ×10 facts come last: she can work those out
  };
  return [...keys].sort((x, y) => trouble(getStats(data, y)) - trouble(getStats(data, x)) || rank(x) - rank(y) || x.localeCompare(y));
}

/** Tables from this one up are taught (×1 and ×2 are skipped). */
export const FIRST_TABLE = 3;
const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** The facts the learning path works with: the selected tables, without ×1 / ×2 facts. */
export function learnableKeys(tables: number[]): FactKey[] {
  const pick = (ts: number[]) => keysInRange(ts).filter((k) => Math.min(...parseKey(k)) >= FIRST_TABLE);
  const keys = pick(tables.length ? tables : ALL_TABLES);
  return keys.length ? keys : pick(ALL_TABLES);
}

/** The tables in teaching order (selected tables from ×3 up). */
export function tableOrder(tables: number[]): number[] {
  const ts = [...new Set(tables)].filter((t) => t >= FIRST_TABLE).sort((a, b) => a - b);
  return ts.length ? ts : ALL_TABLES.filter((t) => t >= FIRST_TABLE);
}

/** Facts of one table (both orders are one fact), e.g. table 4 → 3×4, 4×4, 4×5 … 4×10. */
export function tableKeys(t: number, tables: number[]): FactKey[] {
  return learnableKeys(tables)
    .filter((k) => parseKey(k).includes(t))
    .sort((x, y) => {
      const ox = parseKey(x).find((n) => n !== t) ?? t;
      const oy = parseKey(y).find((n) => n !== t) ?? t;
      return ox - oy;
    });
}

/** Memorised: remembered alone on GRADUATE_DAYS different days since the last help (or mastered). */
export function isMemorised(s: FactStats): boolean {
  return isGraduated(s) || s.state === 'mastered';
}

/** The table being learned now, or null when every selected table is memorised. */
export function currentTable(data: LearningData, tables: number[]): number | null {
  for (const t of tableOrder(tables)) {
    if (!tableKeys(t, tables).every((k) => isMemorised(getStats(data, k)))) return t;
  }
  return null;
}

/** Progress of one table for the child and parents. */
export function tableProgress(data: LearningData, t: number, tables: number[]): { total: number; memorised: number; taught: number } {
  const keys = tableKeys(t, tables);
  return {
    total: keys.length,
    memorised: keys.filter((k) => isMemorised(getStats(data, k))).length,
    taught: keys.filter((k) => getStats(data, k).attempts > 0).length,
  };
}

/** New facts allowed now: only from the current table, in table order. */
export function freshFacts(data: LearningData, tables: number[]): FactKey[] {
  const t = currentTable(data, tables);
  if (t === null) return [];
  const keys = tableKeys(t, tables).filter((k) => getStats(data, k).attempts === 0);
  return [...keys].sort((x, y) => trouble(getStats(data, y)) - trouble(getStats(data, x)) || keys.indexOf(x) - keys.indexOf(y));
}

/** How many new facts may join now, from how many facts are still on their way. */
export function newAllowance(data: LearningData, range: FactKey[]): number {
  const taught = range.filter((k) => getStats(data, k).attempts > 0);
  if (taught.length === 0) return SET_SIZE;
  if (lastResultStruggling(data)) return 0;
  const onTheWay = taught.filter((k) => !isGraduated(getStats(data, k)) && getStats(data, k).state !== 'mastered').length;
  return onTheWay >= 8 ? 0 : onTheWay >= 4 ? 1 : MAX_NEW_PER_SESSION;
}

/**
 * The facts for the next session (up to six; fewer, or none, when everything else rests or was
 * already remembered today). See the header for the order.
 */
export function chooseLearnSet(data: LearningData, tables: number[], now: number = Date.now()): FactKey[] {
  const range = learnableKeys(tables);
  const today = dayKey(now);
  const st = (k: FactKey) => getStats(data, k);
  const available = (k: FactKey) => !isResting(data, k) && !st(k).cleanDays.includes(today);
  const taught = range.filter((k) => st(k).attempts > 0 && available(k));
  // new facts: only the current table, in order
  const fresh = freshFacts(data, tables);
  const cur = currentTable(data, tables);
  const inCurrent = (k: FactKey) => cur !== null && parseKey(k).includes(cur);

  const focus = data.learnFocus.filter((k) => taught.includes(k));
  const reinforce = taught
    .filter((k) => !focus.includes(k) && st(k).cleanDays.length === 0)
    .sort((x, y) => Number(inCurrent(y)) - Number(inCurrent(x)) || trouble(st(y)) - trouble(st(x)) || (st(x).lastPracticed ?? 0) - (st(y).lastPracticed ?? 0) || x.localeCompare(y));
  const due = taught
    .filter((k) => !focus.includes(k) && st(k).cleanDays.length > 0 && (st(k).nextDue ?? 0) <= now)
    .sort((x, y) => (st(x).nextDue ?? 0) - (st(y).nextDue ?? 0) || x.localeCompare(y));

  const newCount = Math.min(newAllowance(data, range), fresh.length, SET_SIZE);
  let set = [...focus, ...reinforce, ...due].slice(0, SET_SIZE - newCount);
  set = [...set, ...fresh.slice(0, newCount)];
  if (set.length < SET_SIZE) {
    // Short: reviews that are not due yet, then a few more new facts (always taught first).
    const early = taught
      .filter((k) => !set.includes(k))
      .sort((x, y) => (st(x).nextDue ?? 0) - (st(y).nextDue ?? 0) || x.localeCompare(y));
    set = [...set, ...early].slice(0, SET_SIZE);
  }
  if (set.length < SET_SIZE) {
    const extra = fresh.filter((k) => !set.includes(k)).slice(0, Math.max(0, MAX_NEW_PER_SESSION + 1 - newCount));
    set = [...set, ...extra].slice(0, SET_SIZE);
  }
  return set;
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

function recallStep(key: FactKey, s: FactStats, rng: Rng, kind: 'first' | 'check' | 'planned'): LearnStep {
  const [x, y] = parseKey(key);
  // practise both orders: the one seen less often, or at random
  let flip = x !== y && (s.seenAB > s.seenBA || (s.seenAB === s.seenBA && rng() < 0.5));
  if (kind === 'planned' && x !== y) flip = !flip; // the planned retry asks the other order
  const [a, b] = flip ? [y, x] : [x, y];
  if (kind === 'check') return { type: 'recall', id: uid('c'), key, a, b, retry: false, check: true };
  if (kind === 'planned') return { type: 'recall', id: uid('p'), key, a, b, retry: true, planned: true };
  return { type: 'recall', id: uid('r'), key, a, b, retry: false };
}

/**
 * Steps that are skipped right now: teaching for facts remembered in today's day check, planned
 * retries for facts already remembered alone this session, and any question about a resting fact
 * (pass the learning data so the rest rule applies).
 */
export function isSkipped(session: LearnSession, step: LearnStep, data?: LearningData): boolean {
  const ok = session.checkedOk;
  const alone = session.aloneKeys ?? [];
  if (step.type === 'study') return step.pair.every((k) => ok.includes(k));
  if (step.type === 'design') return !!step.forPair && step.forPair.every((k) => ok.includes(k) || alone.includes(k));
  if (step.type === 'recall') {
    if (data && !step.check && isResting(data, step.key)) return true;
    if (step.check) return false;
    if (step.planned) return ok.includes(step.key) || alone.includes(step.key);
    return !step.retry && ok.includes(step.key);
  }
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
  // 1. Day check: facts from before are asked before anything is shown.
  for (const k of shuffled(keys.filter((k) => needsDayCheck(getStats(data, k), today)), rng)) {
    steps.push(recallStep(k, getStats(data, k), rng, 'check'));
  }
  // 2. Supported learning, pair by pair (facts remembered in the check are skipped at run time).
  pairs.forEach((pair, i) => {
    steps.push({ type: 'study', id: uid('s'), pair });
    steps.push({ type: 'design', id: uid('d'), slot: DESIGN_SLOTS[i % DESIGN_SLOTS.length], forPair: pair });
    for (const k of shuffled(pair, rng)) steps.push(recallStep(k, getStats(data, k), rng, 'first'));
  });
  // 3. Planned spaced retry for everything taught today, in pair order (so each one has other
  //    questions between it and its answer), after one more design action.
  if (pairs.length) {
    steps.push({ type: 'design', id: uid('d'), slot: 'prop', forPair: [...keys] });
    for (const pair of pairs) for (const k of pair) steps.push(recallStep(k, getStats(data, k), rng, 'planned'));
  }
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
    aloneKeys: [],
    look: {},
  };
}

/**
 * After a recall answer: count it. A first try that needed help is covered by the planned retry later.
 * A retry (or a try with no planned retry left) that needed help gets one more try later —
 * after a design action and the questions that follow it — never right after the answer was shown.
 */
export function afterLearnAnswer(session: LearnSession, index: number, outcome: Outcome, afterHelp = false): LearnSession {
  const step = session.steps[index];
  if (!step || step.type !== 'recall' || session.answeredStepId === step.id) return session;
  const alone = outcome === 'independent' && !afterHelp;
  const prevAlone = session.aloneKeys ?? [];
  const s: LearnSession = {
    ...session,
    steps: [...session.steps],
    retries: { ...session.retries },
    alone: session.alone + (alone ? 1 : 0),
    afterHelp: session.afterHelp + (outcome === 'independent' && afterHelp ? 1 : 0),
    helped: session.helped + (outcome === 'independent' ? 0 : 1),
    checkAlone: session.checkAlone + (step.check && outcome === 'independent' ? 1 : 0),
    checkTotal: session.checkTotal + (step.check ? 1 : 0),
    answeredStepId: step.id,
    aloneKeys: alone && !prevAlone.includes(step.key) ? [...prevAlone, step.key] : prevAlone,
  };
  if (step.check) {
    // Remembered in the day check: no teaching today. Otherwise the pair's supported learning follows.
    if (outcome === 'independent') s.checkedOk = [...s.checkedOk, step.key];
    return s;
  }
  if (outcome === 'independent') return s;
  const plannedLater = s.steps.some((x, i) => i > index && x.type === 'recall' && x.planned && x.key === step.key);
  if (plannedLater) return s;
  const done = s.retries[step.key] ?? 0;
  if (done >= MAX_RETRIES) return s;
  s.retries[step.key] = done + 1;

  // The retry uses the other order, so both forms of the fact get practised.
  const retry: LearnStep = { type: 'recall', id: uid('r'), key: step.key, a: step.b, b: step.a, retry: true };
  const nextDesign = s.steps.findIndex((x, i) => i > index && x.type === 'design' && !isSkipped(s, x));
  if (nextDesign >= 0) {
    let pos = nextDesign + 1;
    while (pos < s.steps.length && s.steps[pos].type === 'recall') pos += 1;
    s.steps.splice(pos, 0, retry);
  } else {
    // At the end: a short design action first (unless enough questions follow), then the retry.
    const finishIdx = s.steps.findIndex((x) => x.type === 'finish');
    const at = finishIdx >= 0 ? finishIdx : s.steps.length;
    const others = s.steps.slice(index + 1, at).filter((x) => x.type === 'recall' && !isSkipped(s, x)).length;
    const insert: LearnStep[] = others >= GAP_QUESTIONS ? [retry] : [{ type: 'design', id: uid('d'), slot: 'prop' }, retry];
    s.steps.splice(at, 0, ...insert);
  }
  return s;
}

/** First step at or after `from` that is not skipped (the finish step is never skipped). */
export function nextActiveIndex(session: LearnSession, from: number, data?: LearningData): number {
  let i = from;
  while (i < session.steps.length - 1 && isSkipped(session, session.steps[i], data)) i += 1;
  return i;
}

/** Session goal for the child: each fact of today, and whether she already remembered it alone. */
export function sessionGoal(session: LearnSession): { key: FactKey; done: boolean }[] {
  const ok = new Set([...session.checkedOk, ...(session.aloneKeys ?? [])]);
  return session.keys.map((key) => ({ key, done: ok.has(key) }));
}

export function finishLearnLog(data: LearningData, session: LearnSession, now: number): LearningData {
  const day = dayKey(now);
  // Only the day check shows what was remembered from an earlier day.
  const log = { ...(data.daily[day] ?? emptyDaily()) };
  log.learnSessions += 1;
  const remembered = new Set([...session.checkedOk, ...(session.aloneKeys ?? [])]);
  return {
    ...data,
    learnSession: null,
    learnLog: [...data.learnLog, { day, alone: session.checkAlone, total: session.checkTotal }].slice(-20),
    daily: { ...data.daily, [day]: log },
    // a challenge focus is done once the fact was remembered alone
    learnFocus: data.learnFocus.filter((k) => !remembered.has(k)),
  };
}

/** Coins for taking part — the same whether she remembered alone or needed help. */
export function learnReward(_session: LearnSession): number {
  return 50;
}

// ---------- explaining a fact's stage to parents ----------

export type FactPhaseId = 'new' | 'reinforce' | 'learning' | 'resting' | 'today' | 'due' | 'spacing' | 'mastered';
export interface FactPhase {
  id: FactPhaseId;
  label: string;
  /** why it is (or is not) being asked now */
  why: string;
  /** what comes next */
  next: string;
}

const dateLabel = (t: number) => new Date(t).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });

/** Where a fact stands and why — from the saved data only. */
export function factPhase(data: LearningData, key: FactKey, now: number): FactPhase {
  const s = getStats(data, key);
  const today = dayKey(now);
  const rest = restRemaining(s, data.questionCount);
  const due = s.nextDue ?? now;
  const nextDate = due <= now ? 'בשיעור הבא' : dayKey(due) === dayKey(addDays(now, 1)) ? 'מחר' : `ב־${dateLabel(due)}`;
  if (s.attempts === 0)
    return { id: 'new', label: 'עוד לא נלמדה', why: 'עדיין לא הוצגה בשיעור.', next: 'תוצג קודם עם התשובה, כשיהיה מקום לעובדה חדשה.' };
  if (rest > 0)
    return {
      id: 'resting',
      label: 'במנוחה',
      why: `נזכרה בה לבד ${s.independentCorrect} פעמים (${REST_AFTER} ומעלה), לכן היא לא נשאלת ברצף.`,
      next: `תוכל לחזור אחרי עוד ${rest} שאלות על עובדות אחרות (${REST_QUESTIONS} בסך הכול).`,
    };
  if (s.state === 'mastered')
    return { id: 'mastered', label: 'נזכרת היטב', why: `נזכרה בה לבד ב־${s.cleanDays.length} ימים שונים בלי עזרה בינתיים.`, next: `חזרה לשמירה ${nextDate}.` };
  if (s.cleanDays.includes(today))
    return { id: 'today', label: 'נזכרה לבד היום', why: 'הצלחה באותו יום עוד לא מוכיחה זיכרון לטווח ארוך.', next: `בדיקת זיכרון ${nextDate}, לפני שהתשובה מוצגת.` };
  if (s.cleanDays.length === 0 && s.lastMissDay === today)
    return {
      id: 'reinforce',
      label: 'בחיזוק',
      why: 'היום הוצגה לה התשובה, היה רמז או טעות — לכן היא חוזרת.',
      next: `תישאל שוב רק אחרי לפחות ${GAP_QUESTIONS} שאלות או פעילות אחרת, בלי שהתשובה גלויה.`,
    };
  if (s.cleanDays.length === 0)
    return { id: 'learning', label: 'בלמידה', why: 'עוד לא נזכרה בה לבד מאז העזרה האחרונה.', next: 'בשיעור הבא: קודם בדיקת זיכרון; אם צריך — לימוד עם התשובה וניסיון חוזר.' };
  if (due <= now)
    return { id: 'due', label: 'הגיע זמן חזרה', why: `נזכרה בה לבד ב־${s.cleanDays.length} ימים, ועבר מספיק זמן.`, next: 'תיבדק בשיעור הבא, לפני שהתשובה מוצגת.' };
  return { id: 'spacing', label: 'בדרך לזכירה', why: `נזכרה בה לבד ב־${s.cleanDays.length} ימים שונים.`, next: `החזרה הבאה ${nextDate} — המרווחים גדלים בהדרגה.` };
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
