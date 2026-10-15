import { describe, expect, it } from 'vitest';
import { FURNITURE, WEARABLES } from '../content/catalog';
import { DOGS, STARTER_DOG_IDS } from '../content/dogs';
import { applyOutcome } from '../learning/data';
import { afterLearnAnswer } from '../learning/learnPath';
import { setStudioDog, startLearnSession, updatePlaced } from './game';
import { defaultSave, loadSave, SAVE_KEY, validateSave, writeSave, type StorageLike } from './save';
import { SCHEMA_VERSION } from './types';

const NOW = new Date(2026, 9, 14, 17, 0).getTime();

function memory(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

const NEW_FREE_WEARABLES = ['flower_clip', 'sun_hat', 'headband', 'sunglasses', 'bell_ribbon', 'polka_bandana', 'hoodie', 'flowy_dress', 'knit_vest', 'ballet_shoes', 'big_bow', 'handbag', 'bouquet'];
const NEW_FREE_FURNITURE = ['loveseat', 'cozy_chair', 'pouf', 'cushions', 'dressing_table', 'arch_mirror', 'wall_shelves', 'hat_rack', 'rug_fluffy', 'rug_rect', 'side_lamp', 'wall_lamp', 'hanging_plant', 'flower_pot', 'star_garland', 'heart_wall', 'round_dog_bed', 'paw_poster'];

/** A save as version 1 of the game stored it (with the old warm-up fields). */
function versionOneSave() {
  const s = defaultSave(NOW - 86400_000) as unknown as Record<string, any>;
  s.version = 1;
  s.profile = { studioName: 'הסטודיו של ליאורי', paletteId: 'pink', ownDogId: 'lola', onboarded: true };
  s.coins = 37;
  s.owned.wearables = [...s.owned.wearables.filter((id: string) => !NEW_FREE_WEARABLES.includes(id)), 'crown'];
  s.owned.furniture = [...s.owned.furniture.filter((id: string) => !NEW_FREE_FURNITURE.includes(id)), 'chandelier'];
  s.studio.items.push({ uid: 'c1', itemId: 'chandelier', x: 400, y: 130, scale: 1, flip: false });
  s.outfits = { lola: { head: { itemId: 'crown', color: '#f2c14e' } } };
  s.album = [{ id: 'a1', dogId: 'lola', outfit: s.outfits.lola, backdrop: 'stage', title: 'מלכה', requestId: null, directionId: null, stars: 0, createdAt: NOW - 86400_000 }];
  let learning = { facts: {}, daily: {}, newByDay: {} } as any;
  learning = applyOutcome(learning, { a: 7, b: 8, outcome: 'independent', usedHint: false }, NOW - 86400_000);
  delete learning.facts['7x8'].supported;
  for (const d of Object.values(learning.daily) as any[]) {
    delete d.supported;
    delete d.learnSessions;
  }
  s.learning = { facts: learning.facts, daily: learning.daily, newByDay: learning.newByDay, warmupDone: true, level: 1 };
  return s;
}

describe('upgrading an existing save to version 2', () => {
  it('keeps progress and purchases, and grants every new free item', () => {
    const st = memory({ [SAVE_KEY]: JSON.stringify(versionOneSave()) });
    const r = loadSave(st, NOW);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    const s = r.data;
    expect(s.version).toBe(SCHEMA_VERSION);
    expect(s.coins).toBe(37);
    expect(s.profile.ownDogId).toBe('lola');
    expect(s.owned.wearables).toContain('crown');
    expect(s.owned.furniture).toContain('chandelier');
    expect(s.studio.items.some((i) => i.itemId === 'chandelier')).toBe(true);
    expect(s.outfits.lola.head?.itemId).toBe('crown');
    expect(s.album[0].title).toBe('מלכה');
    expect(s.learning.facts['7x8'].independentCorrect).toBe(1);
    expect(s.learning.facts['7x8'].supported).toBe(0);
    expect(s.learning.learnSet).toEqual([]);
    expect(s.learning.learnSession).toBeNull();
    for (const id of NEW_FREE_WEARABLES) expect(s.owned.wearables).toContain(id);
    for (const id of NEW_FREE_FURNITURE) expect(s.owned.furniture).toContain(id);
    expect('warmupDone' in s.learning).toBe(false);
  });

  it('new games receive all expanded free items, with rares reserved for missions', () => {
    expect(WEARABLES.filter((w) => w.price === 0&&!w.rare)).toHaveLength(41);
    expect(FURNITURE.filter((f) => f.price === 0&&!f.rare).length).toBeGreaterThanOrEqual(38);
    expect(defaultSave(NOW).owned.furniture).toContain('kitchen_sink');
    expect(defaultSave(NOW).owned.furniture).toContain('bath_towel');
  });
});

describe('toy poodle', () => {
  it('exists, can be the studio dog for free in an existing game, and is a client', () => {
    const kakao = DOGS.find((d) => d.id === 'kakao');
    expect(kakao?.breed).toBe('פודל טוי');
    expect(kakao?.curly).toBe(true);
    expect(STARTER_DOG_IDS).toContain('kakao');
    const s = setStudioDog({ ...defaultSave(NOW), coins: 0 }, 'kakao');
    expect(s.profile.ownDogId).toBe('kakao');
    expect(s.metDogs).toContain('kakao');
    expect(s.coins).toBe(0);
  });
});

describe('stopping in the middle', () => {
  it('a session saved mid-way loads back at the same step, with its retries', () => {
    let s = startLearnSession({ ...defaultSave(NOW), profile: { ...defaultSave(NOW).profile, onboarded: true } }, NOW);
    let session = s.learning.learnSession!;
    const recallIdx = session.steps.findIndex((x) => x.type === 'recall');
    session = { ...afterLearnAnswer(session, recallIdx, 'supported'), index: recallIdx + 1, look: { body: 'hoodie' } };
    s = { ...s, learning: { ...s.learning, learnSession: session } };
    const st = memory();
    writeSave(st, s);
    const r = loadSave(st, NOW + 3600_000);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    const back = r.data.learning.learnSession!;
    expect(back.index).toBe(recallIdx + 1);
    expect(back.steps).toEqual(session.steps);
    expect(back.look).toEqual({ body: 'hoodie' });
    expect(back.helped).toBe(1);
    expect(r.data.learning.learnSet).toEqual(session.keys);
  });

  it('a damaged mid-way session is dropped without touching the rest of the save', () => {
    const s = defaultSave(NOW) as unknown as Record<string, any>;
    s.coins = 12;
    s.learning.learnSession = { steps: [{ type: 'nonsense' }], keys: ['7x8'] };
    const v = validateSave(s, NOW);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.data.learning.learnSession).toBeNull();
      expect(v.data.coins).toBe(12);
    }
  });
});

describe('furniture colours', () => {
  it('can be changed, saved and reset to the palette colour', () => {
    let s = defaultSave(NOW);
    const uid = s.studio.items[0].uid;
    s = updatePlaced(s, uid, { color: '#ff7eb6' });
    const st = memory();
    writeSave(st, s);
    const r = loadSave(st, NOW);
    expect(r.status === 'ok' && r.data.studio.items[0].color).toBe('#ff7eb6');
    s = updatePlaced(s, uid, { color: undefined });
    expect(JSON.parse(JSON.stringify(s)).studio.items[0].color).toBeUndefined();
  });
});
