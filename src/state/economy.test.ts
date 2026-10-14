import { describe, expect, it } from 'vitest';
import { REQUESTS, WEARABLES } from '../content/catalog';
import { buy, canBuy, registerPracticeDay, roundReward, styleStars } from './economy';
import { defaultSave } from './save';

const NOW = new Date(2026, 9, 13, 10, 0).getTime();

describe('shop', () => {
  const paid = WEARABLES.find((w) => w.price > 0)!;

  it('starts with a meaningful free selection already owned', () => {
    const s = defaultSave(NOW);
    expect(s.owned.wearables.length).toBeGreaterThanOrEqual(6);
    expect(s.owned.furniture.length).toBeGreaterThanOrEqual(6);
    expect(canBuy(s, 'wearable', 'collar_classic')).toEqual({ ok: false, reason: 'owned' });
  });

  it('buys an item and takes exactly its price', () => {
    const s = { ...defaultSave(NOW), coins: 100 };
    const { save, check } = buy(s, 'wearable', paid.id);
    expect(check.ok).toBe(true);
    expect(save.coins).toBe(100 - paid.price);
    expect(save.owned.wearables).toContain(paid.id);
  });

  it('prevents buying the same item twice', () => {
    const s = { ...defaultSave(NOW), coins: 500 };
    const first = buy(s, 'wearable', paid.id).save;
    const second = buy(first, 'wearable', paid.id);
    expect(second.check).toEqual({ ok: false, reason: 'owned' });
    expect(second.save).toBe(first);
    expect(second.save.coins).toBe(500 - paid.price);
  });

  it('refuses when there are not enough coins and says how many are missing', () => {
    const s = { ...defaultSave(NOW), coins: paid.price - 5 };
    const r = buy(s, 'wearable', paid.id);
    expect(r.check).toEqual({ ok: false, reason: 'coins', missing: 5 });
    expect(r.save.coins).toBe(paid.price - 5);
    expect(r.save.owned.wearables).not.toContain(paid.id);
  });

  it('refuses unknown items', () => {
    const s = { ...defaultSave(NOW), coins: 500 };
    expect(buy(s, 'furniture', 'nope').check).toEqual({ ok: false, reason: 'unknown' });
  });

  it('can buy furniture and backgrounds too', () => {
    let s = { ...defaultSave(NOW), coins: 500 };
    s = buy(s, 'furniture', 'chandelier').save;
    s = buy(s, 'background', 'wall_hearts').save;
    expect(s.owned.furniture).toContain('chandelier');
    expect(s.owned.backgrounds).toContain('wall_hearts');
    expect(s.coins).toBe(500 - 35 - 20);
  });
});

describe('rewards', () => {
  it('finishing a round pays the same base whatever the answers were', () => {
    expect(roundReward(['wrong', 'wrong', 'hinted'], 'scheduled').base).toBe(roundReward(['independent'], 'scheduled').base);
  });

  it('independent answers give only a small bonus — guessing never pays more than trying', () => {
    const allIndependent = roundReward(Array(7).fill('independent'), 'scheduled');
    const allHinted = roundReward(Array(7).fill('hinted'), 'scheduled');
    expect(allIndependent.total - allHinted.total).toBeLessThanOrEqual(8);
    expect(allIndependent.independentBonus).toBeLessThan(allIndependent.base);
    expect(roundReward(['wrong'], 'scheduled').total).toBeGreaterThan(0);
  });

  it('practice-day bonuses count total days, not consecutive days', () => {
    let s = defaultSave(NOW);
    let r = registerPracticeDay(s, NOW);
    expect(r.milestone).toBeNull();
    // skip several days — nothing is lost
    r = registerPracticeDay(r.save, NOW + 5 * 86400_000);
    expect(r.milestone?.days).toBe(2);
    expect(r.save.coins).toBe(20);
    // same day again does not pay twice
    s = r.save;
    r = registerPracticeDay(s, NOW + 5 * 86400_000 + 3600_000);
    expect(r.milestone).toBeNull();
    expect(r.save.coins).toBe(20);
  });

  it('style stars reflect the chosen direction', () => {
    const dir = REQUESTS.find((q) => q.id === 'sportday')!.directions[0]; // sport
    expect(styleStars({}, dir)).toBe(0);
    expect(
      styleStars(
        { body: { itemId: 'sport_tank', color: '#000000' }, neck: { itemId: 'bandana', color: '#000000' }, head: { itemId: 'cap', color: '#000000' } },
        dir
      )
    ).toBe(3);
    expect(styleStars({ body: { itemId: 'tutu', color: '#000000' } }, dir)).toBe(0);
  });
});
