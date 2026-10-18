import { describe, expect, it } from 'vitest';
import { applyOutcome, emptyLearning, type LearningData } from './data';
import { difficulty, factKey, HARD_THRESHOLD, keysInRange, parseKey } from './facts';
import { addDays } from './scheduler';
import {
  afterAnswer,
  answerFor,
  BASE_FACT_ITEMS,
  isHardFor,
  MAX_STEPS,
  planRound,
  type QuestionStep,
  type Round,
} from './session';
import { getStats } from './data';

const NOW = new Date(2026, 9, 13, 10, 0).getTime();
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function seeded(seed = 1) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

const questions = (r: Round) => r.steps.filter((s): s is QuestionStep => s.type === 'question');

/** A learner who has practised `keys` independently `daysAgo` days ago. */
function practised(keys: string[], daysAgo: number, outcome: 'independent' | 'wrong' = 'independent'): LearningData {
  let d: LearningData = emptyLearning();
  const t = addDays(NOW, -daysAgo) + 9 * 3600_000;
  for (const k of keys) {
    const [a, b] = parseKey(k);
    d = applyOutcome(d, { a, b, outcome, usedHint: false }, t);
  }
  // the earlier tables are done, so facts from any table may be asked (one-table-at-a-time is tested in tables.test)
  return { ...d, newByDay: {}, tablesDone: [3, 4, 5, 6, 7, 8, 9] };
}

describe('round planning', () => {
  it('never asks an untaught fact: a new fact is first shown with its answer', () => {
    const r = planRound(emptyLearning(), ALL, NOW, seeded());
    const qs = questions(r);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.form).toBe('study');
    expect(qs.length).toBeLessThanOrEqual(3);
  });

  it('after a study card, the same fact is asked (without the answer) a few questions later', () => {
    let r = planRound(emptyLearning(), ALL, NOW, seeded());
    const first = r.steps[0] as QuestionStep;
    expect(first.form).toBe('study');
    r = afterAnswer(r, 0, 'supported');
    const later = r.steps.findIndex((s, i) => i > 0 && s.type === 'question' && s.key === first.key);
    expect(later).toBeGreaterThanOrEqual(2);
    expect((r.steps[later] as QuestionStep).form).toBe('input');
  });

  it('prefers taught facts, adding at most one new fact once several were taught', () => {
    const d = practised(['6x7', '7x8', '3x4', '3x9', '5x6', '4x8'], 2);
    const qs = questions(planRound(d, ALL, NOW, seeded()));
    expect(qs.filter((q) => q.form === 'study').length).toBeLessThanOrEqual(1);
    for (const q of qs) if (q.form !== 'study') expect(getStats(d, q.key).attempts).toBeGreaterThan(0);
  });

  it('new facts come only from the table being learned (×3 first), never ×1 / ×2', () => {
    const d = { ...practised(['3x4', '3x5', '5x5'], 0), learnSet: ['7x9'], tablesDone: [] };
    for (let seed = 1; seed < 8; seed++) {
      const qs = questions(planRound(d, ALL, NOW, seeded(seed)));
      for (const q of qs) expect(Math.min(...parseKey(q.key))).toBeGreaterThanOrEqual(3);
      for (const q of qs.filter((x) => x.reason === 'new')) expect(parseKey(q.key)).toContain(3);
    }
  });

  it('mixes due reviews and familiar facts', () => {
    // 6 facts practised 2 days ago (due), 3 practised today (familiar, not due)
    let d = practised(['6x7', '7x8', '3x4', '3x9', '5x6', '4x8'], 2);
    d = { ...d, facts: { ...d.facts, ...practised(['3x3', '3x5', '4x4'], 0).facts } };
    const r = planRound(d, ALL, NOW, seeded());
    expect(r.mode).toBe('scheduled');
    const qs = questions(r);
    const reasons = qs.map((q) => q.reason);
    // several facts are waiting for review, so no new material this time
    expect(reasons.filter((x) => x === 'new').length).toBe(0);
    expect(reasons).toContain('review');
    expect(reasons).toContain('known');
    expect(r.steps.length).toBeGreaterThanOrEqual(6);
    expect(r.steps.length).toBeLessThanOrEqual(MAX_STEPS);
  });

  it('never asks a fact and its reverse in the same round plan', () => {
    for (let seed = 1; seed < 30; seed++) {
      const d = practised(keysInRange(ALL).slice(0, 30), 3);
      const keys = questions(planRound(d, ALL, NOW, seeded(seed))).map((q) => q.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('practises both orders of a fact over time', () => {
    let d = practised(['7x8'], 2);
    const first = questions(planRound(d, [7], NOW, seeded())).find((q) => q.key === '7x8')!;
    // the practised order was a<=b ('ab'), so the next time it should be shown as 8 × 7
    expect([first.a, first.b]).toEqual([8, 7]);
    d = applyOutcome(d, { a: 8, b: 7, outcome: 'independent', usedHint: false }, NOW);
    expect(getStats(d, '7x8').seenBA).toBe(1);
  });

  it('avoids two hard facts in a row when easier ones are available', () => {
    const hard = ['6x7', '7x8', '8x9', '6x8', '7x9', '6x9'];
    let d = practised(hard, 2, 'wrong');
    d = { ...d, facts: { ...d.facts, ...practised(['3x3', '3x4', '3x5', '3x10', '4x5'], 0).facts } };
    for (let seed = 1; seed < 20; seed++) {
      const qs = questions(planRound(d, ALL, NOW, seeded(seed)));
      for (let i = 1; i < qs.length; i++) {
        const both = isHardFor(qs[i].key, getStats(d, qs[i].key)) && isHardFor(qs[i - 1].key, getStats(d, qs[i - 1].key));
        expect(both).toBe(false);
      }
      const hardCount = qs.filter((q) => isHardFor(q.key, getStats(d, q.key))).length;
      expect(hardCount).toBeLessThanOrEqual(3);
    }
  });

  it('respects the parent-chosen range of tables', () => {
    const d = practised(['6x7', '2x6', '3x8'], 2);
    const qs = questions(planRound(d, [6], NOW, seeded()));
    for (const q of qs) expect(q.a === 6 || q.b === 6).toBe(true);
  });

  it('limits new facts per day', () => {
    let d = practised(['2x3'], 3);
    d = { ...d, newByDay: { ['2026-10-13']: 6 } };
    const qs = questions(planRound(d, ALL, NOW, seeded()));
    expect(qs.some((q) => q.reason === 'new')).toBe(false);
  });

  it('offers free practice when everything planned is done, without new material', () => {
    let d = practised(keysInRange([3]), 0); // all ×3 facts practised today, none due
    d = { ...d, newByDay: {} };
    const r = planRound(d, [3], NOW, seeded());
    expect(r.mode).toBe('free');
    expect(questions(r).every((q) => q.reason === 'free')).toBe(true);
    expect(questions(r).length).toBeGreaterThan(0);
  });

  it('includes a matching game only with practised facts and a missing-factor question', () => {
    const keys = keysInRange(ALL)
      .filter((k) => difficulty(k) < HARD_THRESHOLD && parseKey(k)[0] > 1)
      .slice(0, 20);
    let d = practised(keys, 2);
    // make them "known" with a second day
    for (const k of keys) {
      const [a, b] = parseKey(k);
      d = applyOutcome(d, { a, b, outcome: 'independent', usedHint: false }, addDays(NOW, -1) + 3600_000);
    }
    const r = planRound(d, ALL, NOW, seeded(5));
    const match = r.steps.find((s) => s.type === 'match');
    expect(match).toBeTruthy();
    if (match && match.type === 'match') {
      expect(match.pairs.length).toBeGreaterThanOrEqual(3);
      for (const p of match.pairs) expect(getStats(d, p.key).attempts).toBeGreaterThan(0);
      expect(new Set(match.pairs.map((p) => p.a * p.b)).size).toBe(match.pairs.length);
    }
    const missing = questions(r).find((q) => q.form === 'missing');
    expect(missing).toBeTruthy();
    if (missing) expect(answerFor(missing)).toBe(missing.b);
  });
});

describe('in-round repetition', () => {
  const d = practised(['6x7', '7x8', '3x4', '3x9', '5x6', '4x8'], 2);

  it('a wrong answer comes back a few questions later, once', () => {
    let r = planRound(d, ALL, NOW, seeded());
    const before = r.steps.length;
    const q = r.steps[0] as QuestionStep;
    r = afterAnswer(r, 0, 'wrong');
    expect(r.steps.length).toBe(before + 1);
    const repeatIdx = r.steps.findIndex((s, i) => i > 0 && s.type === 'question' && s.key === q.key);
    expect(repeatIdx).toBe(3);
    expect((r.steps[repeatIdx] as QuestionStep).reason).toBe('repeat');
    // a second miss on the repeat does not add yet another copy
    const len = r.steps.length;
    r = afterAnswer(r, repeatIdx, 'wrong');
    expect(r.steps.length).toBe(len);
  });

  it('a hinted answer also comes back later in the round', () => {
    let r = planRound(d, ALL, NOW, seeded());
    const before = r.steps.length;
    r = afterAnswer(r, 0, 'hinted');
    expect(r.steps.length).toBe(before + 1);
  });

  it('a familiar fact answered independently is not repeated', () => {
    let r = planRound(d, ALL, NOW, seeded());
    const idx = r.steps.findIndex((s) => s.type === 'question' && s.reason !== 'new');
    const before = r.steps.length;
    r = afterAnswer(r, idx, 'independent');
    expect(r.steps.length).toBe(before);
  });

  it('never grows the round beyond the maximum', () => {
    let r = planRound(d, ALL, NOW, seeded());
    for (let i = 0; i < r.steps.length; i++) r = afterAnswer(r, i, 'wrong');
    expect(r.steps.length).toBeLessThanOrEqual(MAX_STEPS);
  });

  it('round has about 6–8 steps', () => {
    const r = planRound(d, ALL, NOW, seeded());
    expect(r.steps.length).toBeGreaterThanOrEqual(BASE_FACT_ITEMS + 1);
    expect(r.steps.length).toBeLessThanOrEqual(MAX_STEPS);
    expect(factKey(7, 8)).toBe('7x8');
  });
});
