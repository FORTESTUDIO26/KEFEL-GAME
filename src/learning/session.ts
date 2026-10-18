// Builds the short practice round (≈6–8 steps) that each client brings.
// Clients mostly use facts that were already taught. A fact that was never taught is first
// shown with its answer (a "study" card) and only asked a few questions later.
// A round never repeats a fact in both orders at once, and avoids runs of hard facts.

import { difficulty, HARD_THRESHOLD, parseKey, type FactKey } from './facts';
import { dayKey, isDue, isKnown, restRemaining, type FactStats, type Outcome } from './scheduler';
import { getStats, type LearningData } from './data';
import { allowedKeys, freshFacts, newFactOrder } from './learnPath';

export const BASE_FACT_ITEMS = 5;
export const MAX_STEPS = 8;
export const NEW_PER_DAY = 6;

export type StepReason = 'review' | 'new' | 'known' | 'repeat' | 'free';

export interface QuestionStep {
  type: 'question';
  id: string;
  key: FactKey;
  a: number;
  b: number;
  /** 'missing' asks for the second factor: a × ? = a·b; 'study' shows the answer to copy and say aloud */
  form: 'input' | 'missing' | 'study';
  reason: StepReason;
}

export interface MatchStep {
  type: 'match';
  id: string;
  pairs: { key: FactKey; a: number; b: number }[];
}

export type Step = QuestionStep | MatchStep;
export type RoundMode = 'scheduled' | 'free';

export interface Round {
  mode: RoundMode;
  steps: Step[];
  /** keys already re-inserted once this round */
  requeued: FactKey[];
}

export type Rng = () => number;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `s${Date.now().toString(36)}${idCounter}`;
}

/** Pick the display order that was asked less often (both forms get practised). */
export function orient(key: FactKey, stats: FactStats, rng: Rng): [number, number] {
  const [x, y] = parseKey(key);
  if (x === y) return [x, y];
  if (stats.seenAB < stats.seenBA) return [x, y];
  if (stats.seenBA < stats.seenAB) return [y, x];
  return rng() < 0.5 ? [x, y] : [y, x];
}

function question(key: FactKey, data: LearningData, reason: StepReason, rng: Rng): QuestionStep {
  const [a, b] = orient(key, getStats(data, key), rng);
  return { type: 'question', id: nextId(), key, a, b, form: 'input', reason };
}

export function isHardFor(key: FactKey, s: FactStats): boolean {
  return difficulty(key) >= HARD_THRESHOLD || (s.state === 'learning' && s.wrong > 0);
}

/** Alternate easy/hard so hard facts never come in a row when it can be avoided. */
export function arrange(steps: QuestionStep[], data: LearningData): QuestionStep[] {
  const hard = steps.filter((s) => isHardFor(s.key, getStats(data, s.key)));
  const easy = steps.filter((s) => !isHardFor(s.key, getStats(data, s.key)));
  const out: QuestionStep[] = [];
  // Start with an easy one, unless hard ones outnumber easy ones (then H E H E H avoids pairs).
  let lastHard = hard.length <= easy.length;
  while (hard.length || easy.length) {
    if (lastHard && easy.length) {
      out.push(easy.shift()!);
      lastHard = false;
    } else if (hard.length) {
      out.push(hard.shift()!);
      lastHard = true;
    } else {
      out.push(easy.shift()!);
      lastHard = false;
    }
  }
  return out;
}

function weakness(s: FactStats): number {
  return s.wrong * 2 + s.hintUses - s.independentCorrect * 0.5;
}

function shuffled<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function planRound(data: LearningData, tables: number[], now: number, rng: Rng = Math.random): Round {
  const base: Round = { mode: 'scheduled', steps: [], requeued: [] };

  const st = (k: FactKey) => getStats(data, k);
  // Resting facts (5 successes, fewer than 20 other questions since) are never asked.
  // Same facts as the learning path (no ×1 / ×2); resting facts are never asked.
  const pool = allowedKeys(data, tables).filter((k) => restRemaining(st(k), data.questionCount) === 0);
  const today = dayKey(now);

  const due = pool
    .filter((k) => isDue(st(k), now))
    .sort((x, y) => (st(x).nextDue ?? 0) - (st(y).nextDue ?? 0) || weakness(st(y)) - weakness(st(x)));
  // New facts only from the table being learned now, in order.
  const allowedNew = new Set(freshFacts(data, tables));
  const fresh = pool.filter((k) => st(k).attempts === 0 && allowedNew.has(k));
  const known = pool
    .filter((k) => st(k).attempts > 0 && !isDue(st(k), now))
    .sort((x, y) => (st(x).lastPracticed ?? 0) - (st(y).lastPracticed ?? 0));
  const allowance = Math.max(0, NEW_PER_DAY - (data.newByDay[today] ?? 0));

  let mode: RoundMode = 'scheduled';
  let chosen: { key: FactKey; reason: StepReason }[] = [];

  if (due.length === 0 && (fresh.length === 0 || allowance === 0)) {
    // Everything planned is done: free practice that does not disturb the schedule.
    mode = 'free';
    const practiced = pool.filter((k) => st(k).attempts > 0);
    const weakest = [...practiced].sort((x, y) => weakness(st(y)) - weakness(st(x))).slice(0, 2);
    const rest = shuffled(practiced.filter((k) => !weakest.includes(k)), rng);
    chosen = [...weakest, ...rest].slice(0, BASE_FACT_ITEMS + 1).map((key) => ({ key, reason: 'free' }));
  } else {
    const log = data.daily[today];
    const struggling = !!log && log.questions >= 5 && (log.wrong + log.hinted) / log.questions > 0.4;
    // Mostly taught facts. New ones only as study cards: up to 3 while little has been taught,
    // otherwise at most one — and none when the day is hard or many facts are waiting.
    const taught = due.length + known.length;
    const maxNew = taught < 4 ? 3 : struggling || due.length >= 4 ? 0 : 1;
    const nNew = Math.min(fresh.length, allowance, maxNew);
    // Prefer facts from the "לומדות וזוכרות" set, then the same order that path uses
    // (×1, ×2 and ×10 facts last — she can work those out).
    const newKeys = [...fresh.filter((k) => data.learnSet.includes(k)), ...newFactOrder(fresh.filter((k) => !data.learnSet.includes(k)), data)].slice(0, nNew);

    const keepKnown = known.length > 0 ? 1 : 0;
    const nDue = Math.min(due.length, BASE_FACT_ITEMS - newKeys.length - keepKnown);
    chosen = [
      ...due.slice(0, nDue).map((key) => ({ key, reason: 'review' as StepReason })),
      ...newKeys.map((key) => ({ key, reason: 'new' as StepReason })),
    ];
    for (const key of known) {
      if (chosen.length >= BASE_FACT_ITEMS) break;
      chosen.push({ key, reason: 'known' });
    }
    for (const key of due.slice(nDue)) {
      if (chosen.length >= BASE_FACT_ITEMS) break;
      chosen.push({ key, reason: 'review' });
    }

    // Don't flood the round with hard facts: at most half, swapping the lowest-priority
    // hard review (then hard new fact) for a familiar easy one. Swapped reviews stay due for next round.
    const isHard = (k: FactKey) => isHardFor(k, st(k));
    const maxHard = Math.floor(chosen.length / 2);
    const spareEasy = known.filter((k) => !chosen.some((c) => c.key === k) && !isHard(k));
    while (chosen.filter((c) => isHard(c.key)).length > maxHard && spareEasy.length) {
      let idx = chosen.map((c) => c.reason === 'review' && isHard(c.key)).lastIndexOf(true);
      if (idx < 0) idx = chosen.map((c) => c.reason === 'new' && isHard(c.key)).lastIndexOf(true);
      if (idx < 0) break;
      chosen[idx] = { key: spareEasy.shift()!, reason: 'known' };
    }
  }

  const questions = arrange(
    chosen.map((c) => question(c.key, data, c.reason, rng)),
    data
  ).map((q) => (q.reason === 'new' ? { ...q, form: 'study' as const } : q));

  // One familiar fact asked as "missing factor" for variety.
  const missingIdx = questions.findIndex(
    (q) => (q.reason === 'known' || q.reason === 'free' || q.reason === 'review') && isKnown(st(q.key)) && q.a !== 1 && q.b !== 1
  );
  if (missingIdx >= 0) questions[missingIdx] = { ...questions[missingIdx], form: 'missing' };

  // A short matching game with 4 practised facts that aren't in this round.
  const inRound = new Set(questions.map((q) => q.key));
  const matchPool = pool
    .filter((k) => !inRound.has(k) && st(k).attempts > 0)
    .sort((x, y) => Number(isKnown(st(y))) - Number(isKnown(st(x))) || difficulty(x) - difficulty(y));
  const steps: Step[] = [...questions];
  if (matchPool.length >= 4) {
    const picked = shuffled(matchPool.slice(0, 8), rng).slice(0, 4);
    const products = new Set<number>();
    const pairs: MatchStep['pairs'] = [];
    for (const k of picked) {
      const [a, b] = orient(k, st(k), rng);
      if (products.has(a * b)) continue; // each answer must be unique to match
      products.add(a * b);
      pairs.push({ key: k, a, b });
    }
    if (pairs.length >= 3) steps.splice(Math.min(3, steps.length), 0, { type: 'match', id: nextId(), pairs });
  } else if (mode === 'scheduled') {
    // No match game yet: add one more question if there is anything left
    // (an easy one, unless the round ends on an easy question anyway).
    const last = questions[questions.length - 1];
    const lastHard = !!last && isHardFor(last.key, st(last.key));
    const extra = [...known, ...due].find((k) => !inRound.has(k) && (!lastHard || !isHardFor(k, st(k))));
    if (extra) steps.push(question(extra, data, known.includes(extra) ? 'known' : 'review', rng));
  }

  return { ...base, mode, steps };
}

/**
 * Update the round after a question was answered:
 * a study card, "עוד לא זוכרת", a hint or a mistake brings the fact back a few questions later (once).
 */
export function afterAnswer(round: Round, index: number, outcome: Outcome): Round {
  const step = round.steps[index];
  if (!step || step.type !== 'question') return round;
  const r: Round = { ...round, steps: [...round.steps], requeued: [...round.requeued] };

  const needsRepeat = outcome !== 'independent' || step.reason === 'new';
  if (!needsRepeat || step.reason === 'repeat' || r.requeued.includes(step.key) || r.steps.length >= MAX_STEPS) {
    return r;
  }
  const pos = Math.min(index + 3, r.steps.length);
  if (pos - index < 2) return r; // no room for "a few questions later"; the schedule brings it back next round
  r.steps.splice(pos, 0, { ...step, id: nextId(), reason: 'repeat', form: 'input' });
  r.requeued.push(step.key);
  return r;
}

export function answerFor(step: QuestionStep): number {
  return step.form === 'missing' ? step.b : step.a * step.b;
}
