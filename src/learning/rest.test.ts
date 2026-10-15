// The 5-successes / 20-questions rule, spacing after help, and what counts as remembering alone.
import { describe, expect, it } from 'vitest';
import { applyOutcome, emptyLearning, getStats, wouldCountAlone, type LearningData } from './data';
import { parseKey } from './facts';
import { afterLearnAnswer, buildLearnSession, chooseLearnSet, factPhase, isResting, isSkipped, nextActiveIndex } from './learnPath';
import { addDays, REST_QUESTIONS } from './scheduler';
import { defaultSave, sanitize } from '../state/save';

const NOW = new Date(2026, 9, 14, 16, 0).getTime();
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const OTHERS = ['3x4', '3x5', '3x6', '4x5', '4x6', '4x7', '5x6', '5x7', '5x8', '3x7', '3x8', '4x8'];

function ask(d: LearningData, a: number, b: number, outcome: 'independent' | 'supported' | 'hinted' | 'wrong', t = NOW) {
  return applyOutcome(d, { a, b, outcome, usedHint: outcome === 'hinted' }, t);
}
const askKey = (d: LearningData, k: string, o: 'independent' | 'supported' | 'hinted' | 'wrong', t = NOW) => {
  const [a, b] = parseKey(k);
  return ask(d, a, b, o, t);
};

/** Five valid successes on 7×8, each on its own day (so every one is remembering alone). */
function fiveSuccesses(): LearningData {
  let d = emptyLearning();
  for (let i = 5; i >= 1; i--) d = ask(d, 7, 8, 'independent', addDays(NOW, -i) + 3600_000);
  return d;
}

describe('the 5-successes / 20-questions rule', () => {
  it('after 5 valid successes the fact rests until 20 questions about other facts were answered', () => {
    let d = fiveSuccesses();
    expect(getStats(d, '7x8').independentCorrect).toBe(5);
    expect(isResting(d, '7x8')).toBe(true);
    for (let i = 0; i < REST_QUESTIONS - 1; i++) d = askKey(d, OTHERS[i % OTHERS.length], 'independent', NOW + i * 1000);
    expect(isResting(d, '7x8')).toBe(true);
    expect(chooseLearnSet(d, ALL, NOW + 60_000)).not.toContain('7x8');
    d = askKey(d, '3x4', 'independent', NOW + 30_000);
    expect(isResting(d, '7x8')).toBe(false);
  });

  it('asking the reversed order (8×7) is the same fact and does not skip the rest', () => {
    const d = fiveSuccesses();
    // the last question was 7×8; asking 8×7 now counts as the same fact
    expect(isResting(d, '7x8')).toBe(true);
    const d2 = ask(d, 8, 7, 'independent', NOW);
    // asking it anyway restarts the count rather than bypassing it
    expect(getStats(d2, '7x8').lastAskedQ).toBe(d2.questionCount);
    expect(isResting(d2, '7x8')).toBe(true);
  });

  it('the counter survives saving and loading again', () => {
    let d = fiveSuccesses();
    for (let i = 0; i < 7; i++) d = askKey(d, OTHERS[i], 'independent', NOW + i * 1000);
    const save = { ...defaultSave(NOW), learning: d };
    const reloaded = sanitize(JSON.parse(JSON.stringify(save)), NOW + 10_000);
    expect(reloaded.learning.questionCount).toBe(d.questionCount);
    expect(getStats(reloaded.learning, '7x8').lastAskedQ).toBe(getStats(d, '7x8').lastAskedQ);
    expect(isResting(reloaded.learning, '7x8')).toBe(true);
  });

  it('a session skips a question about a fact that started resting during the session', () => {
    let d = emptyLearning();
    for (let i = 4; i >= 1; i--) d = ask(d, 7, 8, 'independent', addDays(NOW, -i) + 3600_000);
    let s = buildLearnSession(d, ['7x8', '3x4'], NOW, () => 0.3);
    const check = s.steps.findIndex((x) => x.type === 'recall' && x.check && x.key === '7x8');
    d = ask(d, 7, 8, 'independent', NOW);
    s = afterLearnAnswer(s, check, 'independent');
    expect(isResting(d, '7x8')).toBe(true);
    for (const [i, step] of s.steps.entries()) {
      if (step.type === 'recall' && step.key === '7x8' && i > check) expect(isSkipped(s, step, d)).toBe(true);
    }
    expect(s.steps[nextActiveIndex(s, check + 1, d)].type).not.toBe('recall');
  });

  it('the parent view explains a resting fact with the real numbers', () => {
    const d = fiveSuccesses();
    const ph = factPhase(d, '7x8', NOW);
    expect(ph.id).toBe('resting');
    expect(ph.next).toContain(String(REST_QUESTIONS));
  });
});

describe('help versus remembering alone', () => {
  it('right after seeing the answer is not independent; after 2+ other questions it is', () => {
    let d = emptyLearning();
    // study card: the answer is copied (exposure, not a question)
    d = applyOutcome(d, { a: 6, b: 7, outcome: 'supported', usedHint: false, exposureOnly: true }, NOW);
    expect(d.questionCount).toBe(0);
    expect(wouldCountAlone(d, '6x7', NOW)).toBe(false);
    d = ask(d, 6, 7, 'independent', NOW + 1000); // immediate try
    expect(getStats(d, '6x7').independentCorrect).toBe(0);
    expect(getStats(d, '6x7').afterHelpCorrect).toBe(1);
    d = askKey(d, '3x4', 'independent', NOW + 2000);
    d = askKey(d, '3x5', 'independent', NOW + 3000);
    expect(wouldCountAlone(d, '6x7', NOW + 4000)).toBe(true);
    d = ask(d, 7, 6, 'independent', NOW + 4000); // spaced retry, other order
    expect(getStats(d, '6x7').independentCorrect).toBe(1);
    expect(getStats(d, '6x7').cleanDays).toHaveLength(1);
  });

  it('a hint never counts as independent, and resets the gap', () => {
    let d = emptyLearning();
    d = ask(d, 6, 8, 'hinted', NOW);
    expect(getStats(d, '6x8').independentCorrect).toBe(0);
    d = ask(d, 6, 8, 'independent', NOW + 1000);
    expect(getStats(d, '6x8').independentCorrect).toBe(0);
  });

  it('"עוד לא זוכרת" and a mistake both count as help', () => {
    let d = emptyLearning();
    d = ask(d, 6, 9, 'supported', NOW);
    d = ask(d, 6, 9, 'independent', NOW + 1000);
    expect(getStats(d, '6x9').afterHelpCorrect).toBe(1);
    d = ask(d, 7, 9, 'wrong', NOW);
    d = ask(d, 7, 9, 'independent', NOW + 1000);
    expect(getStats(d, '7x9').independentCorrect).toBe(0);
  });

  it('the next day, a correct answer counts as remembering alone', () => {
    let d = emptyLearning();
    d = ask(d, 6, 9, 'supported', NOW);
    d = ask(d, 6, 9, 'independent', addDays(NOW, 1) + 1000);
    expect(getStats(d, '6x9').independentCorrect).toBe(1);
  });

  it('a full session for new facts makes real progress the same day (no endless repeat)', () => {
    let d = emptyLearning();
    const keys = chooseLearnSet(d, ALL, NOW);
    let s = buildLearnSession(d, keys, NOW, () => 0.4);
    let t = NOW;
    // run the session: copy at study, answer every question correctly
    for (let guard = 0; guard < 60; guard++) {
      const step = s.steps[s.index];
      if (!step || step.type === 'finish') break;
      t += 1000;
      if (step.type === 'study') for (const k of step.pair) d = applyOutcome(d, { ...pk(k), outcome: 'supported', usedHint: false, exposureOnly: true }, t);
      if (step.type === 'recall') {
        const alone = wouldCountAlone(d, step.key, t);
        d = ask(d, step.a, step.b, 'independent', t);
        s = afterLearnAnswer(s, s.index, 'independent', !alone);
      }
      s = { ...s, index: nextActiveIndex(s, s.index + 1, d) };
    }
    // every fact was remembered alone once, in its planned spaced retry
    for (const k of keys) expect(getStats(d, k).independentCorrect).toBe(1);
    expect(s.aloneKeys.sort()).toEqual([...keys].sort());
    // and none of them is offered again today
    const again = chooseLearnSet(d, ALL, t + 60_000);
    for (const k of keys) expect(again).not.toContain(k);
  });
});

function pk(k: string) {
  const [a, b] = parseKey(k);
  return { a, b };
}
