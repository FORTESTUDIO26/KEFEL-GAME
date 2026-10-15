import { describe, expect, it } from 'vitest';
import { addCharacter, characterOf, GUEST_PREFIX, HUMAN_PREFIX, MAX_CHARACTERS, setHumanOutfit } from './characters';
import { moveWithSupports, resolveDrop } from './placement';
import { placeFurniture, removePlaced, updatePlaced } from './game';
import { defaultSave, validateSave } from './save';
import { editRoom, getRoom } from './world';
import { sceneOrder } from './layers';
import type { SaveData } from './types';

const NOW = new Date(2026, 9, 14, 16).getTime();
const base = () => {
  const s = defaultSave(NOW);
  return { ...s, profile: { ...s.profile, onboarded: true, ownDogId: 'bosko' } };
};
const sofaOf = (s: SaveData) => s.studio.items.find((p) => p.itemId === 'sofa')!;

describe('guest dogs and people in rooms', () => {
  it('adds several characters, independent of the room dog, and keeps them after reload', () => {
    let s = base();
    s = addCharacter(s, GUEST_PREFIX + 'lola', NOW);
    s = addCharacter(s, HUMAN_PREFIX + 'maya', NOW + 1);
    s = addCharacter(s, HUMAN_PREFIX + 'saba_avi', NOW + 2);
    expect(s.studio.items.filter((p) => characterOf(p.itemId))).toHaveLength(3);
    expect(s.profile.ownDogId).toBe('bosko');
    // the room's own dog is never added as a guest, and nobody twice
    expect(addCharacter(s, GUEST_PREFIX + 'bosko', NOW + 3)).toBe(s);
    expect(addCharacter(s, GUEST_PREFIX + 'lola', NOW + 4)).toBe(s);
    const v = validateSave(JSON.parse(JSON.stringify(s)), NOW);
    expect(v.ok && v.data.studio.items.filter((p) => characterOf(p.itemId))).toHaveLength(3);
    // learning data is untouched
    expect(s.learning).toEqual(base().learning);
  });

  it('limits the number of characters per room', () => {
    let s = base();
    const ids = ['lola', 'mika', 'ginji', 'nela', 'paprika', 'kakao', 'mochi'];
    ids.forEach((id, i) => (s = addCharacter(s, GUEST_PREFIX + id, NOW + i)));
    expect(s.studio.items.filter((p) => characterOf(p.itemId))).toHaveLength(MAX_CHARACTERS);
  });

  it('seats a guest dog and a person on the sofa; they move with it and land on the floor when it is removed', () => {
    let s = base();
    s = addCharacter(s, GUEST_PREFIX + 'lola', NOW);
    s = addCharacter(s, HUMAN_PREFIX + 'ella', NOW + 1);
    const sofa = sofaOf(s);
    for (const c of s.studio.items.filter((p) => characterOf(p.itemId))) {
      const drop = resolveDrop(s.studio, c.uid, { x: sofa.x, y: sofa.y - 70 });
      expect(drop.supportUid).toBe(sofa.uid);
      s = moveWithSupports(s, c.uid, drop.x, drop.y);
      s = { ...s, studio: { ...s.studio, items: s.studio.items.map((p) => (p.uid === c.uid ? { ...p, supportUid: drop.supportUid } : p)) } };
    }
    // drawn in front of the sofa
    const order = sceneOrder(s.studio);
    for (const c of s.studio.items.filter((p) => characterOf(p.itemId))) expect(order.indexOf(c.uid)).toBeGreaterThan(order.indexOf(sofa.uid));
    const before = s.studio.items.filter((p) => characterOf(p.itemId));
    s = updatePlaced(s, sofa.uid, { x: sofa.x + 50 });
    for (const c of before) expect(s.studio.items.find((p) => p.uid === c.uid)!.x).toBe(c.x + 50);
    s = removePlaced(s, sofa.uid);
    for (const c of s.studio.items.filter((p) => characterOf(p.itemId))) {
      expect(c.supportUid).toBeUndefined();
      expect(c.y).toBe(468);
    }
  });

  it('a person cannot be put on a table like a cup, and a cup cannot sit on a sofa', () => {
    let s = base();
    s = editRoom({ ...s, owned: { ...s.owned, furniture: [...s.owned.furniture, 'kitchen_family_table'] } }, 'studio', (d) => placeFurniture(d, 'kitchen_family_table', NOW));
    s = addCharacter(s, HUMAN_PREFIX + 'maya', NOW + 1);
    const table = s.studio.items.find((p) => p.itemId === 'kitchen_family_table')!;
    const maya = s.studio.items.find((p) => p.itemId === HUMAN_PREFIX + 'maya')!;
    expect(resolveDrop(s.studio, maya.uid, { x: table.x, y: table.y - 96 }).supportUid).toBeUndefined();
  });

  it('dresses a person and removes / re-adds them', () => {
    let s = addCharacter(base(), HUMAN_PREFIX + 'omer', NOW);
    const uid = s.studio.items.find((p) => p.itemId === HUMAN_PREFIX + 'omer')!.uid;
    s = setHumanOutfit(s, uid, 'top', 'top_hoodie');
    expect(s.studio.items.find((p) => p.uid === uid)!.outfit?.top?.itemId).toBe('top_hoodie');
    // wrong slot is ignored
    expect(setHumanOutfit(s, uid, 'shoes', 'top_hoodie')).toBe(s);
    const v = validateSave(JSON.parse(JSON.stringify(s)), NOW);
    expect(v.ok && v.data.studio.items.find((p) => p.uid === uid)!.outfit?.top?.itemId).toBe('top_hoodie');
    s = removePlaced(s, uid);
    expect(s.studio.items.some((p) => p.itemId === HUMAN_PREFIX + 'omer')).toBe(false);
    s = addCharacter(s, HUMAN_PREFIX + 'omer', NOW + 5);
    expect(s.studio.items.some((p) => p.itemId === HUMAN_PREFIX + 'omer')).toBe(true);
  });
});

describe('the ready-made kitchen', () => {
  it('a new profile has cabinets, worktop, sink, hob, oven, fridge, table and chairs', () => {
    const k = getRoom(defaultSave(NOW), 'kitchen').items.map((p) => p.itemId);
    for (const id of ['kitchen_upper', 'kitchen_counter', 'kitchen_sink_counter', 'kitchen_oven_range', 'kitchen_fridge_tall', 'kitchen_family_table', 'kitchen_chair']) expect(k).toContain(id);
  });

  it('items put on the worktop stay there, and a cup on the table moves with the table', () => {
    let s = defaultSave(NOW);
    s = { ...s, world: { ...s.world, unlocked: [...s.world.unlocked, 'kitchen'] } };
    s = editRoom(s, 'kitchen', (d) => placeFurniture(d, 'kitchen_cups', NOW));
    const room = getRoom(s, 'kitchen');
    const table = room.items.find((p) => p.itemId === 'kitchen_family_table')!;
    const cups = room.items.find((p) => p.itemId === 'kitchen_cups')!;
    const drop = resolveDrop(room, cups.uid, { x: table.x, y: table.y - 96 * table.scale });
    expect(drop.supportUid).toBe(table.uid);
    s = editRoom(s, 'kitchen', (d) => {
      const m = moveWithSupports(d, cups.uid, drop.x, drop.y);
      return { ...m, studio: { ...m.studio, items: m.studio.items.map((p) => (p.uid === cups.uid ? { ...p, supportUid: drop.supportUid } : p)) } };
    });
    const reloaded = validateSave(JSON.parse(JSON.stringify(s)), NOW);
    expect(reloaded.ok && getRoom(reloaded.data, 'kitchen').items.find((p) => p.uid === cups.uid)!.supportUid).toBe(table.uid);
    s = editRoom(s, 'kitchen', (d) => updatePlaced(d, table.uid, { x: table.x - 40 }));
    expect(getRoom(s, 'kitchen').items.find((p) => p.uid === cups.uid)!.x).toBeCloseTo(drop.x - 40);
    // removing the table leaves the cups on the floor, reachable
    s = editRoom(s, 'kitchen', (d) => removePlaced(d, table.uid));
    const after = getRoom(s, 'kitchen').items.find((p) => p.uid === cups.uid)!;
    expect(after.supportUid).toBeUndefined();
    expect(after.y).toBe(420);
  });
});
