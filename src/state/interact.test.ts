import { describe, expect, it } from 'vitest';
import { defaultSave, validateSave } from './save';
import { itemState, setCanPouring, tapSwitch, waterPlantsNear } from './interact';
import type { PlacedItem, SaveData } from './types';

const NOW = new Date(2026, 9, 18, 16).getTime();
const place = (items: Partial<PlacedItem>[]): SaveData => {
  const s = defaultSave(NOW);
  const placed = items.map((i, n) => ({ uid: `u${n}`, x: 300, y: 400, scale: 1, flip: false, itemId: 'floor_lamp', ...i }) as PlacedItem);
  return { ...s, owned: { ...s.owned, furniture: [...new Set([...s.owned.furniture, ...placed.map((p) => p.itemId)])] }, studio: { ...s.studio, items: placed } };
};

describe('touching things in the room', () => {
  it('a lamp and a tap switch on and off with a tap; other things have no switch', () => {
    let s = place([{ itemId: 'floor_lamp' }, { itemId: 'bath_sink' }, { itemId: 'sofa' }]);
    expect(itemState(s.studio.items[0])).toBe('off');
    s = tapSwitch(s, 'u0')!;
    expect(itemState(s.studio.items[0])).toBe('on');
    s = tapSwitch(tapSwitch(s, 'u1')!, 'u0')!;
    expect(itemState(s.studio.items[0])).toBe('off');
    expect(itemState(s.studio.items[1])).toBe('on');
    expect(tapSwitch(s, 'u2')).toBeNull();
  });

  it('plants start dry; water from the can near them makes them grow, far plants stay dry', () => {
    const s = place([{ itemId: 'plant_monstera', x: 300 }, { itemId: 'studio_plant_small', x: 900 }, { itemId: 'flower_pot', x: 320 }]);
    expect(itemState(s.studio.items[0])).toBe('dry');
    expect(itemState(s.studio.items[2])).toBe('bloom');
    const once = waterPlantsNear(s, { x: 340, y: 400 });
    expect(once.watered).toBe(1);
    expect(itemState(once.save.studio.items[0])).toBe('watered');
    expect(itemState(once.save.studio.items[1])).toBe('dry');
    const twice = waterPlantsNear(once.save, { x: 340, y: 400 });
    expect(itemState(twice.save.studio.items[0])).toBe('bloom');
    expect(waterPlantsNear(twice.save, { x: 340, y: 400 }).watered).toBe(0);
  });

  it('states are saved (a pouring can is not); nonsense states are dropped', () => {
    let s = place([{ itemId: 'floor_lamp', state: 'on' }, { itemId: 'studio_watering_can' }, { itemId: 'plant_cactus', state: 'purple' }]);
    s = setCanPouring(s, 'u1', true);
    const back = validateSave(JSON.parse(JSON.stringify(s)), NOW);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    const items = back.data.studio.items;
    expect(items[0].state).toBe('on');
    expect(items[1].state).toBeUndefined();
    expect(items[2].state).toBeUndefined();
  });
});

describe('the watering can', () => {
  it('turns toward the plant it waters', () => {
    const s = place([{ itemId: 'studio_watering_can', x: 400 }, { itemId: 'plant_cactus', x: 300 }]);
    const pouring = setCanPouring(s, 'u0', true);
    expect(pouring.studio.items[0]).toMatchObject({ state: 'pour', flip: true });
    expect(setCanPouring(place([{ itemId: 'studio_watering_can', x: 400 }, { itemId: 'plant_cactus', x: 480 }]), 'u0', true).studio.items[0].flip).toBe(false);
  });
});
