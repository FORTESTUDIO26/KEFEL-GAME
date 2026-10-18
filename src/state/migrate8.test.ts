import { describe, expect, it } from 'vitest';
import { defaultSave, loadSave, SAVE_KEY, type StorageLike } from './save';
import { applyOutcome } from '../learning/data';
import { getRoom } from './world';

const NOW = new Date(2026, 9, 15, 12).getTime();

function memory(initial: Record<string, string>) {
  const data = { ...initial };
  const storage: StorageLike = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, removeItem: (k) => { delete data[k]; } };
  return { data, storage };
}

/** A schema-7 save as the published game wrote it (no question counter, no play time, 4-fact opening). */
function v7() {
  const s = defaultSave(NOW - 86400_000) as unknown as Record<string, any>;
  s.version = 7;
  s.coins = 230;
  s.owned.wearables.push('crown');
  s.owned.furniture.push('chandelier');
  s.world.unlocked = ['studio', 'dressing'];
  s.world.rooms.dressing.items = [{ uid: 'd1', itemId: 'chandelier', x: 300, y: 140, scale: 1, flip: false }];
  s.world.rooms.kitchen.items = [];
  s.album = [{ id: 'a1', dogId: 'bosko', outfit: {}, backdrop: 'studio', title: 'שלי', requestId: null, directionId: null, stars: 2, createdAt: NOW }];
  s.learning = applyOutcome(s.learning, { a: 7, b: 8, outcome: 'independent', usedHint: false }, NOW - 86400_000);
  delete s.learning.questionCount;
  delete s.learning.learnFocus;
  delete s.learning.facts['7x8'].lastAskedQ;
  delete s.learning.facts['7x8'].helpQ;
  delete s.playTime;
  s.world.opening = { roomId: 'garden', facts: ['7x8', '7x8', '7x8', '7x8'], index: 1, helped: false };
  return s;
}

describe('upgrading a published (schema 7) save to schema 8', () => {
  it('keeps coins, purchases, designs, album, unlocked rooms and learning; backs up first', () => {
    const old = v7();
    const raw = JSON.stringify(old);
    const { data, storage } = memory({ [SAVE_KEY]: raw });
    const res = loadSave(storage, NOW);
    expect(res.status).toBe('ok');
    if (res.status !== 'ok') return;
    const s = res.data;
    expect(s.version).toBe(9);
    expect(s.coins).toBe(230);
    expect(s.owned.wearables).toContain('crown');
    expect(s.owned.furniture).toContain('chandelier');
    expect(s.world.unlocked).toEqual(['studio', 'dressing']);
    expect(getRoom(s, 'dressing').items[0]).toMatchObject({ uid: 'd1', itemId: 'chandelier', x: 300 });
    expect(s.album).toHaveLength(1);
    expect(s.learning.facts['7x8'].independentCorrect).toBe(1);
    expect(s.learning.questionCount).toBe(0);
    expect(s.playTime.usedMs).toBe(0);
    expect(s.playTime.limitMin).toBe(10);
    // the old in-progress opening simply restarts as a 10-question challenge
    expect(s.world.opening).toBeNull();
    // an empty kitchen gets the ready-made kitchen
    expect(getRoom(s, 'kitchen').items.length).toBeGreaterThanOrEqual(8);
    // an untouched copy of the old save was kept
    const backup = Object.keys(data).find((k) => k.includes('before-v9'));
    expect(backup && data[backup]).toBe(raw);
  });

  it('never replaces a kitchen she already designed', () => {
    const old = v7();
    old.world.rooms.kitchen.items = [{ uid: 'k1', itemId: 'kitchen_table', x: 400, y: 430, scale: 1, flip: false }];
    const { storage } = memory({ [SAVE_KEY]: JSON.stringify(old) });
    const res = loadSave(storage, NOW);
    expect(res.status === 'ok' && getRoom(res.data, 'kitchen').items.map((p) => p.uid)).toEqual(['k1']);
  });
});

describe('upgrading schema 8 to 9: free design time becomes 10 minutes', () => {
  it('a profile on the old 30 minutes moves to 10; another choice is kept', () => {
    const mk = (limitMin: number, usedMs: number) => {
      const s = defaultSave(NOW) as unknown as Record<string, any>;
      s.version = 8; s.playTime = { usedMs, limitMin, warned: true };
      return JSON.stringify(s);
    };
    let r = loadSave(memory({ [SAVE_KEY]: mk(30, 25 * 60_000) }).storage, NOW);
    expect(r.status === 'ok' && r.data.playTime).toEqual({ usedMs: 10 * 60_000, limitMin: 10, warned: false });
    r = loadSave(memory({ [SAVE_KEY]: mk(0, 0) }).storage, NOW);
    expect(r.status === 'ok' && r.data.playTime.limitMin).toBe(0);
    r = loadSave(memory({ [SAVE_KEY]: mk(15, 60_000) }).storage, NOW);
    expect(r.status === 'ok' && r.data.playTime.limitMin).toBe(15);
  });
});
