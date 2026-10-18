// One table at a time, from ×3 up.
import { describe, expect, it } from 'vitest';
import { applyOutcome, emptyLearning, getStats, type LearningData } from './data';
import { parseKey } from './facts';
import { chooseLearnSet, currentTable, learnableKeys, MAX_OLD_REVIEWS, tableKeys, tableProgress, tableReady } from './learnPath';
import { planRound } from './session';
import { addDays } from './scheduler';

const NOW = new Date(2026, 9, 18, 16, 0).getTime();
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const rec = (d: LearningData, k: string, o: 'independent' | 'supported', t: number) => {
  const [a, b] = parseKey(k);
  return applyOutcome(d, { a, b, outcome: o, usedHint: false }, t);
};
/** remembered alone on two different earlier days → memorised */
function memorise(d: LearningData, keys: string[]) {
  for (const k of keys) {
    d = rec(d, k, 'independent', addDays(NOW, -4) + 3600_000);
    d = rec(d, k, 'independent', addDays(NOW, -2) + 3600_000);
  }
  return d;
}

describe('learning one table at a time', () => {
  it('never teaches ×1 or ×2 facts', () => {
    for (const k of learnableKeys(ALL)) expect(Math.min(...parseKey(k))).toBeGreaterThanOrEqual(3);
    expect(learnableKeys(ALL)).toContain('3x10');
  });

  it('starts with the ×3 table, in order', () => {
    expect(currentTable(emptyLearning(), ALL)).toBe(3);
    expect(tableKeys(3, ALL)).toEqual(['3x3', '3x4', '3x5', '3x6', '3x7', '3x8', '3x9', '3x10']);
    expect(chooseLearnSet(emptyLearning(), ALL, NOW)).toEqual(['3x3', '3x4', '3x5', '3x6', '3x7', '3x8']);
  });

  it('adds the rest of the current table before any new table', () => {
    let d = emptyLearning();
    // 3×3…3×8 taught and remembered once; 3×9, 3×10 not yet taught
    for (const k of ['3x3', '3x4', '3x5', '3x6', '3x7', '3x8']) d = rec(d, k, 'independent', addDays(NOW, -2) + 3600_000);
    const set = chooseLearnSet(d, ALL, NOW);
    const fresh = set.filter((k) => getStats(d, k).attempts === 0);
    expect(fresh.length).toBeGreaterThan(0);
    for (const k of fresh) expect(['3x9', '3x10']).toContain(k);
  });

  it('moves on to ×4 only after the ×3 challenge; then ×3 comes back only as a short review', () => {
    let d = memorise(emptyLearning(), tableKeys(3, ALL));
    // ×3 is in memory: its challenge is ready, but nothing from ×4 starts before it is passed
    expect(currentTable(d, ALL)).toBe(3);
    expect(tableReady(d, 3, ALL)).toBe(true);
    for (const k of chooseLearnSet(d, ALL, NOW)) expect(parseKey(k)).toContain(3);
    d = { ...d, tablesDone: [3] };
    expect(currentTable(d, ALL)).toBe(4);
    expect(tableProgress(d, 3, ALL)).toEqual({ total: 8, memorised: 8, taught: 8 });
    const set = chooseLearnSet(d, ALL, NOW);
    const fresh = set.filter((k) => getStats(d, k).attempts === 0);
    expect(fresh.length).toBeGreaterThan(0);
    for (const k of fresh) expect(parseKey(k)).toContain(4);
    // never a table we have not reached (5×6, 7×8 …)
    for (const k of chooseLearnSet(d, ALL, addDays(NOW, 30))) expect(Math.min(...parseKey(k))).toBeLessThanOrEqual(4);
    // a due ×3 fact may come back, but at most ${MAX_OLD_REVIEWS} old facts in a lesson with ×4 facts in it
    const later = chooseLearnSet(d, ALL, addDays(NOW, 30));
    expect(later.filter((k) => !parseKey(k).includes(4)).length).toBeLessThanOrEqual(MAX_OLD_REVIEWS);
  });

  it('never asks facts of tables not reached yet, also in client rounds', () => {
    let d = emptyLearning();
    for (const k of ['7x8', '6x9', '3x4']) {
      const [a, b] = parseKey(k);
      d = applyOutcome(d, { a, b, outcome: 'wrong', usedHint: false }, addDays(NOW, -1) + 3600_000);
    }
    for (const k of chooseLearnSet(d, ALL, NOW)) expect(parseKey(k)).toContain(3);
    for (let i = 1; i < 6; i++) {
      for (const s of planRound(d, ALL, NOW, () => (i * 0.137) % 1).steps) {
        if (s.type === 'question') expect(Math.min(...parseKey(s.key))).toBe(3);
      }
    }
  });
  it('respects the parents\' choice of tables', () => {
    expect(currentTable(emptyLearning(), [7, 8])).toBe(7);
    for (const k of chooseLearnSet(emptyLearning(), [7, 8], NOW)) expect(parseKey(k)).toContain(7);
  });
});
