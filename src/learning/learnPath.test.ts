import { describe, expect, it } from 'vitest';
import { applyOutcome, emptyLearning, getStats, type LearningData } from './data';
import { parseKey } from './facts';
import {
  afterLearnAnswer,
  buildLearnSession,
  chooseLearnSet,
  finishLearnLog,
  factsToTeach,
  hebrewNumber,
  isSkipped,
  learnReward,
  nextActiveIndex,
  MAX_RETRIES,
  pairUp,
  sayAloud,
  SET_SIZE,
  type LearnSession,
  type LearnStep,
} from './learnPath';
import { addDays, GAP_QUESTIONS } from './scheduler';

const NOW = new Date(2026, 9, 14, 16, 0).getTime();
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let seed = 3;
const rng = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const recalls = (s: LearnSession) => s.steps.filter((x): x is Extract<LearnStep, { type: 'recall' }> => x.type === 'recall');

function record(d: LearningData, key: string, outcome: 'independent' | 'supported' | 'hinted' | 'wrong', t: number) {
  const [a, b] = parseKey(key);
  return applyOutcome(d, { a, b, outcome, usedHint: outcome === 'hinted' }, t);
}

describe('choosing the six facts', () => {
  it('starts with six facts, not the trivial ×1/×2/×10 ones first', () => {
    const set = chooseLearnSet(emptyLearning(), ALL);
    expect(set).toHaveLength(SET_SIZE);
    for (const k of set) {
      const [a, b] = parseKey(k);
      expect(a === 1 || b === 10).toBe(false);
    }
  });

  it('starts with facts that already caused trouble', () => {
    let d = emptyLearning();
    d = record(d, '7x8', 'wrong', NOW - 86400_000);
    d = record(d, '6x9', 'hinted', NOW - 86400_000);
    const set = chooseLearnSet(d, ALL);
    expect(set).toContain('7x8');
    expect(set).toContain('6x9');
  });

  it('keeps facts that are not yet remembered alone, and adds new ones only gradually', () => {
    let d = emptyLearning();
    for (const k of ['6x7', '6x8', '7x8', '7x9', '8x9', '6x9']) d = record(d, k, 'supported', addDays(NOW, -1) + 3600_000);
    const set = chooseLearnSet(d, ALL, NOW);
    // six facts on their way (4–7) → at most one new fact
    expect(set.filter((k) => getStats(d, k).attempts === 0)).toHaveLength(1);
    expect(set.filter((k) => getStats(d, k).attempts > 0)).toHaveLength(5);
  });

  it('a fact remembered alone today is not chosen again today — the set moves on', () => {
    let d = emptyLearning();
    for (const k of ['6x7', '6x8', '7x8']) d = record(d, k, 'independent', addDays(NOW, -1) + 3600_000);
    d = record(d, '6x7', 'independent', NOW - 3600_000);
    const set = chooseLearnSet(d, ALL, NOW);
    expect(set).not.toContain('6x7');
    // the others stay, plus new facts — but never more than 3 new at once
    expect(set).toEqual(expect.arrayContaining(['6x8', '7x8']));
    expect(set.filter((k) => getStats(d, k).attempts === 0).length).toBeLessThanOrEqual(3);
  });

  it('facts remembered on 2 days rest until their review is due; new facts take their place', () => {
    let d = emptyLearning();
    for (const k of ['6x7', '6x8', '7x8']) {
      d = record(d, k, 'independent', addDays(NOW, -3) + 3600_000);
      d = record(d, k, 'independent', addDays(NOW, -1) + 3600_000);
    }
    const set = chooseLearnSet(d, ALL, NOW);
    // not due yet: filled in only after the new facts allowed today
    expect(set.filter((k) => getStats(d, k).attempts === 0).length).toBeGreaterThanOrEqual(2);
    expect(set).toHaveLength(6);
  });

  it('with 8 or more facts on their way, nothing new joins', () => {
    let d = emptyLearning();
    const keys = ['6x7', '6x8', '7x8', '7x9', '8x9', '6x9', '3x7', '4x8'];
    for (const k of keys) d = record(d, k, 'supported', addDays(NOW, -1) + 3600_000);
    const set = chooseLearnSet(d, ALL, NOW);
    expect(set.every((k) => keys.includes(k))).toBe(true);
  });

  it('when most check answers needed help, no new facts and extra support', () => {
    let d = emptyLearning();
    for (const k of ['6x7', '6x8']) d = record(d, k, 'supported', addDays(NOW, -1) + 3600_000);
    d = { ...d, learnLog: [{ day: '2026-10-13', alone: 1, total: 4 }] };
    const set = chooseLearnSet(d, ALL, NOW);
    expect(set.filter((k) => getStats(d, k).attempts === 0).length).toBeLessThanOrEqual(3);
    expect(set.slice(0, 2).sort()).toEqual(['6x7', '6x8']);
    expect(buildLearnSession(d, set, NOW, rng).extraSupport).toBe(true);
  });

  it('a failed room challenge points the next session at its facts first', () => {
    let d = emptyLearning();
    for (const k of ['3x4', '6x7', '6x8']) d = record(d, k, 'independent', addDays(NOW, -2) + 3600_000);
    d = { ...d, learnFocus: ['3x4'] };
    expect(chooseLearnSet(d, ALL, NOW)[0]).toBe('3x4');
  });

  it('respects the chosen range of tables', () => {
    for (const k of chooseLearnSet(emptyLearning(), [7])) expect(parseKey(k)).toContain(7);
  });

  it('treats 7×8 and 8×7 as one fact (canonical keys only)', () => {
    const set = chooseLearnSet(emptyLearning(), ALL);
    expect(new Set(set).size).toBe(set.length);
  });
});

describe('a session', () => {
  const keys = ['6x7', '6x8', '7x8', '7x9', '8x9', '6x9'];

  it('has three pairs; each pair is taught, then design, then a first try; planned retries come last', () => {
    const s = buildLearnSession(emptyLearning(), keys, NOW, rng);
    expect(pairUp(keys)).toHaveLength(3);
    const types = s.steps.map((x) => x.type);
    expect(types.filter((t) => t === 'study')).toHaveLength(3);
    for (let i = 0; i < 3; i++) expect(types.slice(i * 4, i * 4 + 4)).toEqual(['study', 'design', 'recall', 'recall']);
    // then one more design action and a planned retry for each fact, in pair order
    expect(types.slice(12)).toEqual(['design', 'recall', 'recall', 'recall', 'recall', 'recall', 'recall', 'finish']);
    const planned = recalls(s).filter((r) => r.planned);
    expect(planned.map((r) => r.key)).toEqual(pairUp(keys).flat());
    // each planned retry has at least GAP_QUESTIONS other questions since its first try
    planned.forEach((p) => {
      const first = s.steps.findIndex((x) => x.type === 'recall' && !x.planned && x.key === p.key);
      const between = s.steps.slice(first + 1, s.steps.indexOf(p)).filter((x) => x.type === 'recall').length;
      expect(between).toBeGreaterThanOrEqual(GAP_QUESTIONS);
    });
  });

  it('day check: every fact practised on an earlier day is asked first, before any answer is shown', () => {
    let d = emptyLearning();
    d = record(d, '6x7', 'independent', addDays(NOW, -2) + 3600_000);
    d = record(d, '6x8', 'supported', addDays(NOW, -1) + 3600_000); // learned only with help
    d = record(d, '7x8', 'wrong', addDays(NOW, -1) + 3600_000);
    const s = buildLearnSession(d, keys, NOW, rng);
    const firstStudy = s.steps.findIndex((x) => x.type === 'study');
    const checks = s.steps.slice(0, firstStudy);
    expect(checks.every((x) => x.type === 'recall' && x.check)).toBe(true);
    expect(checks.map((x) => (x as Extract<LearnStep, { type: 'recall' }>).key).sort()).toEqual(['6x7', '6x8', '7x8']);
    // brand-new facts are never in the check: they are taught first
    for (const k of ['7x9', '8x9', '6x9']) expect(checks.some((x) => (x as { key?: string }).key === k)).toBe(false);
  });

  it('a fact remembered in the check skips today\'s teaching; a fact that needed help gets the supported learning', () => {
    let d = emptyLearning();
    d = record(d, '6x7', 'supported', addDays(NOW, -1) + 3600_000);
    d = record(d, '6x8', 'supported', addDays(NOW, -1) + 3600_000);
    let s = buildLearnSession(d, keys, NOW, rng);
    const c67 = s.steps.findIndex((x) => x.type === 'recall' && x.check && x.key === '6x7');
    const c68 = s.steps.findIndex((x) => x.type === 'recall' && x.check && x.key === '6x8');
    s = afterLearnAnswer(s, c67, 'independent');
    s = afterLearnAnswer(s, c68, 'supported');
    expect(s.checkedOk).toEqual(['6x7']);
    // no retry is added from the check itself — the pair's learning covers it
    expect(recalls(s).filter((r) => r.key === '6x8')).toHaveLength(3); // check, first try, planned retry
    const study = s.steps.find((x) => x.type === 'study' && x.pair.includes('6x8')) as Extract<LearnStep, { type: 'study' }>;
    expect(factsToTeach(s, study)).toEqual(['6x8']);
    const pairRecall67 = s.steps.find((x) => x.type === 'recall' && !x.check && x.key === '6x7')!;
    expect(isSkipped(s, pairRecall67)).toBe(true);
    const pairRecall68 = s.steps.find((x) => x.type === 'recall' && !x.check && x.key === '6x8')!;
    expect(isSkipped(s, pairRecall68)).toBe(false);
  });

  it('a pair remembered completely in the check skips its study, design and questions', () => {
    let d = emptyLearning();
    d = record(d, '6x7', 'supported', addDays(NOW, -1) + 3600_000);
    d = record(d, '6x8', 'supported', addDays(NOW, -1) + 3600_000);
    let s = buildLearnSession(d, keys, NOW, rng);
    for (const k of ['6x7', '6x8']) s = afterLearnAnswer(s, s.steps.findIndex((x) => x.type === 'recall' && x.check && x.key === k), 'independent');
    const firstStudy = s.steps.findIndex((x) => x.type === 'study');
    const next = nextActiveIndex(s, firstStudy);
    const step = s.steps[next] as Extract<LearnStep, { type: 'study' }>;
    expect(step.type).toBe('study');
    expect(step.pair).not.toContain('6x7');
  });

  it('day one to day two: a fact learned yesterday with help is asked before its answer is shown', () => {
    // Day 1: brand-new facts are taught first (no check), learned with help.
    const day1 = addDays(NOW, -1) + 16 * 3600_000;
    let d = emptyLearning();
    let s1 = buildLearnSession(d, keys, day1, rng);
    expect(s1.steps.some((x) => x.type === 'recall' && x.check)).toBe(false);
    expect(s1.steps[0].type).toBe('study');
    for (const k of keys) {
      d = record(d, k, 'supported', day1); // study card / practice with the answer
      d = record(d, k, 'independent', day1 + 600_000); // answered after a design action
    }
    s1 = { ...s1 };
    expect(getStats(d, '6x7').afterHelpCorrect).toBe(1);
    expect(getStats(d, '6x7').independentCorrect).toBe(0);
    // Day 2: the session starts with the check for all six, before any study card.
    const s2 = buildLearnSession(d, keys, NOW, rng);
    const firstStudy = s2.steps.findIndex((x) => x.type === 'study');
    expect(firstStudy).toBe(6);
    expect(s2.steps.slice(0, 6).every((x) => x.type === 'recall' && x.check)).toBe(true);
    // remembering it in the check counts as remembering alone
    d = record(d, '6x7', 'independent', NOW);
    expect(getStats(d, '6x7').independentCorrect).toBe(1);
    expect(getStats(d, '6x7').cleanDays).toHaveLength(1);
  });

  it('later on the same day the check is not repeated for facts she already got help with', () => {
    let d = emptyLearning();
    d = record(d, '6x7', 'supported', NOW - 3600_000);
    const s = buildLearnSession(d, keys, NOW, rng);
    expect(s.steps.some((x) => x.type === 'recall' && x.check && x.key === '6x7')).toBe(false);
  });

  it('after help, the fact comes back later — after another design action — never right away', () => {
    let s = buildLearnSession(emptyLearning(), keys, NOW, rng);
    const firstRecall = s.steps.findIndex((x) => x.type === 'recall');
    const key = (s.steps[firstRecall] as Extract<LearnStep, { type: 'recall' }>).key;
    s = afterLearnAnswer(s, firstRecall, 'supported');
    const retryIdx = s.steps.findIndex((x, i) => i > firstRecall && x.type === 'recall' && x.key === key);
    expect(retryIdx).toBeGreaterThan(firstRecall + 1);
    const between = s.steps.slice(firstRecall + 1, retryIdx).map((x) => x.type);
    expect(between).toContain('design');
    expect((s.steps[retryIdx] as Extract<LearnStep, { type: 'recall' }>).retry).toBe(true);
    expect(s.helped).toBe(1);
  });

  it('retries a fact at most twice more after its planned retry — no endless guessing', () => {
    let s = buildLearnSession(emptyLearning(), keys, NOW, rng);
    const key = recalls(s)[0].key;
    for (let n = 0; n < 8; n++) {
      const idx = s.steps.findIndex((x, i) => i >= s.index && x.type === 'recall' && x.key === key);
      if (idx < 0) break;
      s = { ...afterLearnAnswer(s, idx, 'wrong'), index: idx + 1 };
    }
    expect(recalls(s).filter((r) => r.key === key)).toHaveLength(2 + MAX_RETRIES);
  });

  it('a retry at the very end gets a short design action before it', () => {
    let s = buildLearnSession(emptyLearning(), keys, NOW, rng);
    const last = s.steps.map((x) => x.type).lastIndexOf('recall');
    s = afterLearnAnswer(s, last, 'supported');
    const types = s.steps.slice(last + 1).map((x) => x.type);
    expect(types).toEqual(['design', 'recall', 'finish']);
  });

  it('a session result logs the day check and rewards taking part, not only remembering alone', () => {
    let d = emptyLearning();
    d = record(d, '6x7', 'supported', addDays(NOW, -1) + 3600_000);
    d = record(d, '6x8', 'supported', addDays(NOW, -1) + 3600_000);
    let s = buildLearnSession(d, keys, NOW, rng);
    const c = s.steps.filter((x) => x.type === 'recall' && x.check);
    s = afterLearnAnswer(s, s.steps.indexOf(c[0]), 'independent');
    s = afterLearnAnswer(s, s.steps.indexOf(c[1]), 'supported');
    const pr = recalls(s).find((x) => !x.check)!;
    s = afterLearnAnswer(s, s.steps.indexOf(pr), 'independent', true); // after help
    expect(s.alone).toBe(1);
    expect(s.afterHelp).toBe(1);
    const out = finishLearnLog({ ...d, learnSession: s }, s, NOW);
    expect(out.learnSession).toBeNull();
    // only the day check counts for "is she struggling?"
    expect(out.learnLog[out.learnLog.length - 1]).toEqual({ day: '2026-10-14', alone: 1, total: 2 });
    const helpedOnly = { ...s, alone: 0, afterHelp: 0, helped: 3 };
    expect(learnReward(helpedOnly)).toBe(learnReward(s));
  });

  it('the first day (no day check yet) never counts as struggling', () => {
    const s = buildLearnSession(emptyLearning(), keys, NOW, rng);
    const out = finishLearnLog(emptyLearning(), { ...s, helped: 6 }, NOW);
    expect(out.learnLog[0].total).toBe(0);
    expect(buildLearnSession(out, keys, addDays(NOW, 1), rng).extraSupport).toBe(false);
  });
});

describe('remembering after help is not independent recall', () => {
  it('a correct answer on the day the answer was shown does not count as a remembered day', () => {
    let d = emptyLearning();
    d = record(d, '7x8', 'supported', NOW); // study card
    d = record(d, '7x8', 'independent', NOW + 10 * 60_000); // recall after a design action
    const s = getStats(d, '7x8');
    expect(s.independentCorrect).toBe(0);
    expect(s.afterHelpCorrect).toBe(1);
    expect(s.cleanDays).toEqual([]);
    expect(s.state).toBe('learning');
    // the next day, remembering alone counts
    d = record(d, '7x8', 'independent', addDays(NOW, 1) + 3600_000);
    expect(getStats(d, '7x8').cleanDays).toHaveLength(1);
    expect(getStats(d, '7x8').supported).toBe(1);
  });
});

describe('saying it aloud', () => {
  it('reads numbers the way they are counted', () => {
    expect(hebrewNumber(7)).toBe('שבע');
    expect(hebrewNumber(12)).toBe('שתים עשרה');
    expect(hebrewNumber(56)).toBe('חמישים ושש');
    expect(hebrewNumber(40)).toBe('ארבעים');
    expect(hebrewNumber(100)).toBe('מאה');
    expect(sayAloud(7, 8)).toBe('שבע כפול שמונה שווה חמישים ושש');
  });
});
