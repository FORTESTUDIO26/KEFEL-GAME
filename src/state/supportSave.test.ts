import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../content/catalog';
import { applyOutcome } from '../learning/data';
import { defaultBirthday } from './birthday';
import { changeLayer, DOG_LAYER_ID, sceneOrder } from './layers';
import { isValidSupport } from './placement';
import { playerStorage, PLAYERS_KEY } from './profiles';
import { defaultSave, exportText, loadSave, parseImport, repairFromRaw, sanitize, SAVE_KEY, writeSave, type StorageLike } from './save';
import { SCHEMA_VERSION, type PlacedItem, type RoomLayout, type SaveData } from './types';

const NOW = new Date(2026, 9, 15, 12).getTime();
const placed = (uid: string, itemId: string, supportUid?: string): PlacedItem =>
  ({ uid, itemId, x: 300, y: 400, scale: 1, flip: false, ...(supportUid ? { supportUid } : {}) });
const room = (items: PlacedItem[], supportUid?: string): RoomLayout =>
  ({ wall: 'wall_stripes', floor: 'floor_wood', items, dog: { x: 300, y: 350, ...(supportUid ? { supportUid } : {}) } });
function withRooms(layout: RoomLayout): SaveData {
  const save = defaultSave(NOW);
  save.owned.furniture = [...new Set([...save.owned.furniture, ...layout.items.map(p => p.itemId)])];
  save.studio = structuredClone(layout);
  save.world.rooms.kitchen = structuredClone(layout);
  return save;
}
function imported(save: SaveData): SaveData {
  const result = parseImport(exportText(save, NOW), NOW + 1);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.errors.join(', '));
  return result.data;
}

describe('schema 7 persistence and support repair', () => {
  it('upgrades schema 6 without losing money, purchases, profile, learning or album', () => {
    const old = defaultSave(NOW - 1000);
    old.version = 6;
    old.coins = 147; old.totalEarned = 923;
    old.profile = { studioName: 'My saved studio', paletteId: 'pink', ownDogId: 'kakao', onboarded: true };
    old.owned.wearables.push('crown'); old.owned.furniture.push('chandelier');
    old.outfits.kakao = { head: { itemId: 'crown', color: '#f2c14e' } };
    old.learning = applyOutcome(old.learning, { a: 7, b: 8, outcome: 'independent', usedHint: false }, NOW);
    old.progress.roundsCompleted = 12; old.progress.clientsServed = 9;
    old.album = [{ id: 'memory', dogId: 'kakao', outfit: old.outfits.kakao, backdrop: 'stage', title: 'Keep me', requestId: null, directionId: null, stars: 3, createdAt: NOW }];
    const { birthday: _birthday, ...legacy } = old;
    const raw = JSON.stringify(legacy);
    const data: Record<string, string> = { [PLAYERS_KEY]: 'unrelated player library', unrelated: 'keep', 'liori-studio:player:other:save': '{"coins":999}' };
    const storage: StorageLike = { getItem: k => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, removeItem: k => { delete data[k]; } };
    const scoped = playerStorage(storage, 'active');
    scoped.setItem(SAVE_KEY, raw);
    const before = { ...data };
    const result = loadSave(scoped, NOW);
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('migration failed');
    const next = result.data;
    expect(next.version).toBe(SCHEMA_VERSION); expect(next.version).toBe(10);
    for (const key of ['coins', 'totalEarned', 'profile', 'progress', 'album', 'outfits'] as const) expect(next[key]).toEqual(old[key]);
    // learning starts over (schema 10, Sharon's request); the old save is kept as a backup
    expect(next.learning.facts).toEqual({});
    expect(next.owned.wearables).toContain('crown'); expect(next.owned.furniture).toContain('chandelier');
    expect(next.birthday).toEqual(defaultBirthday());
    // loading changes nothing except one untouched copy of the older save
    const backups = Object.keys(data).filter(k => !(k in before));
    expect(backups).toEqual([`liori-studio:player:active:backup:${NOW}-before-v10`]);
    expect(data[backups[0]]).toBe(raw);
    for (const key of Object.keys(before)) expect(data[key]).toBe(before[key]);
    expect(writeSave(scoped, next)).toBe(true);
    for (const key of Object.keys(before).filter(k => k !== 'liori-studio:player:active:save')) expect(data[key]).toBe(before[key]);
  });

  it.each(['kitchen', 'outfit', 'party', 'done'] as const)('persists birthday %s including temporary locked-room access', stage => {
    const save = defaultSave(NOW);
    save.birthday = { stage, active: stage !== 'done', theme: '#8ed8c5', baselineLearn: 4, baselineClaims: ['learn:kept'], photoId: stage === 'done' ? 'photo' : null, completedAt: stage === 'done' ? NOW : null };
    const destination = stage === 'kitchen' ? 'kitchen' : stage === 'outfit' ? 'dressing' : 'garden';
    save.world.activeRoom = destination;
    const next = imported(save);
    expect(next.birthday).toEqual(save.birthday);
    expect(next.world.activeRoom).toBe(stage === 'done' ? 'studio' : destination);
    expect(next.world.unlocked).toEqual(['studio']);
  });

  it.each(['sofa', 'yard_bench', FURNITURE.find(f => f.baseId === 'sofa')!.id])('round-trips valid dog support on %s in studio and kitchen', itemId => {
    const layout = room([placed('seat', itemId), placed('table', 'kitchen_table'), placed('cups', 'kitchen_cups', 'table')], 'seat');
    expect(isValidSupport(layout, DOG_LAYER_ID, 'seat')).toBe(true);
    const save = withRooms(layout), before = structuredClone(save), next = imported(save);
    for (const r of [next.studio, next.world.rooms.kitchen]) {
      expect(r.dog.supportUid).toBe('seat');
      expect(r.items.find(p => p.uid === 'cups')?.supportUid).toBe('table');
    }
    expect(save).toEqual(before);
  });

  it('scrubs incompatible, orphaned, self and cyclic links without discarding valid branches or progress', () => {
    const layout = room([
      placed('table', 'kitchen_table'), placed('cups', 'kitchen_cups', 'table'),
      placed('big', 'sofa', 'table'), placed('orphan', 'bowl', 'absent'),
      placed('self', 'flower_pot', 'self'), placed('a', 'shelf', 'b'), placed('b', 'shelf', 'a'),
      placed('after-cycle', 'kitchen_plates', 'a'), placed('bed', 'dog_bed'), placed('on-seat', 'bowl', 'bed'),
    ], 'table');
    const save = withRooms(layout); save.coins = 72; save.progress.clientsServed = 16;
    const before = structuredClone(save), next = repairFromRaw(JSON.stringify(save), NOW);
    for (const r of [next.studio, next.world.rooms.kitchen]) {
      expect(r.items).toHaveLength(layout.items.length);
      expect(r.dog).toEqual({ x: 300, y: 350 });
      for (const p of r.items) expect(p.supportUid).toBe(p.uid === 'cups' ? 'table' : p.uid === 'after-cycle' ? 'a' : undefined);
      expect(r.items.map(({ supportUid: _link, ...p }) => p)).toEqual(layout.items.map(({ supportUid: _link, ...p }) => p));
    }
    expect(next.coins).toBe(72); expect(next.progress).toEqual(save.progress);
    expect(sanitize(next, NOW)).toEqual(next); expect(save).toEqual(before);
  });

  it('does not let a broken component erase a valid dog support elsewhere', () => {
    const save = withRooms(room([placed('seat', 'yard_bench'), placed('a', 'shelf', 'b'), placed('b', 'shelf', 'a')], 'seat'));
    const next = imported(save);
    expect(next.studio.dog.supportUid).toBe('seat');
    expect(next.world.rooms.kitchen.dog.supportUid).toBe('seat');
  });

  it('drops cross-room and removed/unowned hosts and rejects the reserved dog UID', () => {
    const save = withRooms(room([placed('cups', 'kitchen_cups', 'elsewhere'), placed(DOG_LAYER_ID, 'sofa')], DOG_LAYER_ID));
    save.world.rooms.kitchen = room([placed('elsewhere', 'kitchen_table')]);
    save.studio.items.push(placed('missing-owned', 'chandelier'), placed('plant', 'flower_pot', 'missing-owned'));
    save.owned.furniture.push('flower_pot');
    save.owned.furniture = save.owned.furniture.filter(id => id !== 'chandelier');
    const next = imported(save);
    expect(next.studio.items.map(p => p.uid)).toEqual(['cups', 'plant']);
    expect(next.studio.items.every(p => !p.supportUid)).toBe(true);
    expect(next.studio.dog.supportUid).toBeUndefined();
  });
});

describe('support depth and layer overrides', () => {
  it('renders support depths before manual order, retaining manual order within a depth', () => {
    const layout = room([placed('table', 'kitchen_table'), placed('cups', 'kitchen_cups', 'table'), placed('seat', 'sofa')], 'seat');
    layout.order = ['cups', DOG_LAYER_ID, 'table', 'seat'];
    expect(sceneOrder(layout)).toEqual(['table', 'seat', 'cups', DOG_LAYER_ID]);
    const save = withRooms(layout), next = changeLayer(save, 'table', 'front');
    const order = sceneOrder(next.studio);
    expect(order.indexOf('table')).toBeLessThan(order.indexOf('cups'));
    expect(order.indexOf('seat')).toBeLessThan(order.indexOf(DOG_LAYER_ID));
    expect(sceneOrder(imported(next).studio)).toEqual(order);
  });
  it('keeps deeper descendants above hosts and terminates on malformed cycles', () => {
    const layout = room([placed('root', 'kitchen_table'), placed('middle', 'shelf', 'root'), placed('top', 'bowl', 'middle')]);
    layout.order = ['top', 'middle', 'root', DOG_LAYER_ID];
    expect(sceneOrder(layout)).toEqual(['root', DOG_LAYER_ID, 'middle', 'top']);
    layout.items[0].supportUid = 'top';
    expect(new Set(sceneOrder(layout)).size).toBe(4);
  });
});
