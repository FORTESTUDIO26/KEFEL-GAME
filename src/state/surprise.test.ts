import { describe, expect, it } from 'vitest';
import { defaultSave, validateSave } from './save';
import { claimSurprise, MAX_SURPRISES_PER_DAY, SURPRISE_COINS, surprisesLeft } from './surprise';

const NOW = new Date(2026, 9, 18, 16).getTime();
const TOMORROW = new Date(2026, 9, 19, 9).getTime();

describe('room surprises', () => {
  it('give a few coins, at most three a day, and come back the next day', () => {
    let s = defaultSave(NOW);
    expect(surprisesLeft(s, NOW)).toBe(MAX_SURPRISES_PER_DAY);
    for (let i = 0; i < 5; i++) s = claimSurprise(s, NOW);
    expect(s.coins).toBe(MAX_SURPRISES_PER_DAY * SURPRISE_COINS);
    expect(s.totalEarned).toBe(MAX_SURPRISES_PER_DAY * SURPRISE_COINS);
    expect(surprisesLeft(s, NOW)).toBe(0);
    expect(surprisesLeft(s, TOMORROW)).toBe(MAX_SURPRISES_PER_DAY);
    s = claimSurprise(s, TOMORROW);
    expect(s.surprise).toEqual({ day: '2026-10-19', found: 1 });
  });

  it('survive a reload and repair a broken value; old saves without it are fine', () => {
    const s = claimSurprise(defaultSave(NOW), NOW);
    const back = validateSave(JSON.parse(JSON.stringify(s)), NOW);
    expect(back.ok && back.data.surprise).toEqual({ day: '2026-10-18', found: 1 });
    const broken = validateSave({ ...JSON.parse(JSON.stringify(s)), surprise: { day: 'x', found: 99 } }, NOW);
    expect(broken.ok && broken.data.surprise).toEqual({ day: '', found: 0 });
    const { surprise: _drop, ...old } = JSON.parse(JSON.stringify(s));
    const fromOld = validateSave(old, NOW);
    expect(fromOld.ok && surprisesLeft(fromOld.data, NOW)).toBe(MAX_SURPRISES_PER_DAY);
  });
});
