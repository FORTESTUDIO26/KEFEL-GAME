import { describe, expect, it } from 'vitest';
import { addDays, dayKey, emptyStats, isDue, recordOutcome, type FactStats } from './scheduler';

const DAY0 = new Date(2026, 9, 13, 10, 0).getTime();
const at = (days: number, hour = 10) => new Date(2026, 9, 13 + days, hour, 0).getTime();
const opts = { orientation: 'ab' as const, usedHint: false };

describe('spaced repetition', () => {
  it('a new fact answered independently once is not "remembered well"', () => {
    const s = recordOutcome(emptyStats('7x8'), 'independent', DAY0, opts);
    expect(s.state).not.toBe('mastered');
    expect(s.stage).toBe(1);
    expect(s.nextDue).toBe(addDays(DAY0, 1));
  });

  it('independent successes on later days grow the interval', () => {
    let s = recordOutcome(emptyStats('7x8'), 'independent', DAY0, opts);
    s = recordOutcome(s, 'independent', at(1), opts);
    expect(s.stage).toBe(2);
    expect(s.nextDue).toBe(addDays(at(1), 3));
    s = recordOutcome(s, 'independent', at(4), opts);
    expect(s.stage).toBe(3);
    expect(s.nextDue).toBe(addDays(at(4), 7));
  });

  it('repeating a fact many times on the same day does not count as several days', () => {
    let s = emptyStats('6x7');
    for (let i = 0; i < 5; i++) s = recordOutcome(s, 'independent', DAY0 + i * 60_000, opts);
    expect(s.stage).toBe(1);
    expect(s.cleanDays).toEqual([dayKey(DAY0)]);
    expect(s.state).not.toBe('mastered');
  });

  it('"remembered well" needs independent successes on 3 different days', () => {
    let s = recordOutcome(emptyStats('6x8'), 'independent', DAY0, opts);
    s = recordOutcome(s, 'independent', at(1), opts);
    expect(s.state).not.toBe('mastered');
    s = recordOutcome(s, 'independent', at(4), opts);
    expect(s.state).toBe('mastered');
  });

  it('a hinted answer is correct but not independent, and shortens the interval', () => {
    let s = recordOutcome(emptyStats('8x9'), 'independent', DAY0, opts);
    s = recordOutcome(s, 'independent', at(1), opts); // stage 2, due in 3 days
    s = recordOutcome(s, 'hinted', at(4), { orientation: 'ab', usedHint: true });
    expect(s.correct).toBe(3);
    expect(s.independentCorrect).toBe(2);
    expect(s.hintedCorrect).toBe(1);
    expect(s.hintUses).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.cleanDays).toEqual([]);
    expect(s.stage).toBe(1);
    expect(s.nextDue).toBe(addDays(at(4), 1));
  });

  it('hinted answers never lead to "remembered well"', () => {
    let s = emptyStats('7x7');
    for (let d = 0; d < 6; d++) s = recordOutcome(s, 'hinted', at(d), { orientation: 'ab', usedHint: true });
    expect(s.state).toBe('learning');
    expect(s.independentCorrect).toBe(0);
  });

  it('a mistake resets the stage and makes the fact due right away', () => {
    let s = recordOutcome(emptyStats('7x9'), 'independent', DAY0, opts);
    s = recordOutcome(s, 'independent', at(1), opts);
    s = recordOutcome(s, 'wrong', at(4), opts);
    expect(s.stage).toBe(0);
    expect(s.wrong).toBe(1);
    expect(isDue(s, at(4))).toBe(true);
    expect(s.state).toBe('learning');
  });

  it('a mistake after mastery removes the mastery label until new clean days', () => {
    let s: FactStats = emptyStats('6x9');
    s = recordOutcome(s, 'independent', DAY0, opts);
    s = recordOutcome(s, 'independent', at(1), opts);
    s = recordOutcome(s, 'independent', at(4), opts);
    expect(s.state).toBe('mastered');
    s = recordOutcome(s, 'wrong', at(11), opts);
    expect(s.state).not.toBe('mastered');
  });

  it('getting it right later on the same day after a mistake is not counted as progress', () => {
    let s = recordOutcome(emptyStats('7x8'), 'wrong', DAY0, opts);
    s = recordOutcome(s, 'independent', DAY0 + 5 * 60_000, opts); // the in-round repeat
    expect(s.state).toBe('learning');
    expect(s.stage).toBe(0);
    expect(s.cleanDays).toEqual([]);
    expect(s.nextDue).toBe(addDays(DAY0, 1));
    // the next day, an independent answer is real progress
    s = recordOutcome(s, 'independent', at(1), opts);
    expect(s.stage).toBe(1);
    expect(s.state).toBe('reviewing');
  });

  it('the same applies after a hint', () => {
    let s = recordOutcome(emptyStats('6x7'), 'hinted', DAY0, { orientation: 'ab', usedHint: true });
    s = recordOutcome(s, 'independent', DAY0 + 60_000, opts);
    expect(s.state).toBe('learning');
    expect(s.cleanDays).toEqual([]);
  });

  it('free practice does not push the schedule further away', () => {
    let s = recordOutcome(emptyStats('4x6'), 'independent', DAY0, opts); // due tomorrow
    const due = s.nextDue;
    s = recordOutcome(s, 'independent', DAY0 + 3600_000, { ...opts, free: true });
    expect(s.nextDue).toBe(due);
    expect(s.stage).toBe(1);
  });

  it('refuses to record an "independent" answer that used a hint', () => {
    expect(() => recordOutcome(emptyStats('3x3'), 'independent', DAY0, { orientation: 'ab', usedHint: true })).toThrow();
  });

  it('counts both display orders on the same record', () => {
    let s = recordOutcome(emptyStats('7x8'), 'independent', DAY0, { orientation: 'ab', usedHint: false });
    s = recordOutcome(s, 'independent', DAY0, { orientation: 'ba', usedHint: false });
    expect(s.seenAB).toBe(1);
    expect(s.seenBA).toBe(1);
    expect(s.attempts).toBe(2);
  });
});
