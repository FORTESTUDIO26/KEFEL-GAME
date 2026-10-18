// Touching things in the room: lights switch on, taps run, the watering can pours and plants grow.
// Works on the active room (the save passed in is already the room view, as with updatePlaced).
import { interactiveFor, nextState } from '../content/interactive';
import type { PlacedItem, SaveData } from './types';

/** how close (room units) a plant must be to the watering can to get water */
export const WATER_REACH_X = 150;
export const WATER_REACH_Y = 170;

/** The state an item shows in the room. Plants that were never watered start dry, so there is something to do. */
export function itemState(item: PlacedItem): string | undefined {
  const def = interactiveFor(item.itemId);
  if (!def) return undefined;
  if (item.state && def.states.includes(item.state)) return item.state;
  return def.kind === 'plant' && def.initial === 'watered' ? 'dry' : def.initial;
}

const setState = (s: SaveData, uid: string, state: string): SaveData => ({
  ...s,
  studio: { ...s.studio, items: s.studio.items.map((i) => (i.uid === uid ? { ...i, state } : i)) },
});

/** A tap on a light / TV / radio / tap switches it; returns null when the item has no switch. */
export function tapSwitch(s: SaveData, uid: string): SaveData | null {
  const item = s.studio.items.find((i) => i.uid === uid);
  const def = item && interactiveFor(item.itemId);
  if (!item || !def || (def.kind !== 'toggle' && def.kind !== 'water-source')) return null;
  return setState(s, uid, nextState(def, itemState(item)!));
}

export function isSwitch(item: PlacedItem | undefined): boolean {
  const kind = item && interactiveFor(item.itemId)?.kind;
  return kind === 'toggle' || kind === 'water-source';
}
export function isWateringCan(item: PlacedItem | undefined): boolean {
  return !!item && interactiveFor(item.itemId)?.kind === 'watering-can';
}
export function setCanPouring(s: SaveData, uid: string, pouring: boolean): SaveData {
  const next = setState(s, uid, pouring ? 'pour' : 'idle');
  if (!pouring) return next;
  // the spout points right; turn the can toward the closest plant within reach
  const can = next.studio.items.find((i) => i.uid === uid);
  if (!can) return next;
  const plants = next.studio.items.filter((i) => interactiveFor(i.itemId)?.kind === 'plant' && Math.abs(i.x - can.x) <= WATER_REACH_X && Math.abs(i.y - can.y) <= WATER_REACH_Y);
  if (!plants.length) return next;
  const near = plants.reduce((a, b) => (Math.abs(b.x - can.x) < Math.abs(a.x - can.x) ? b : a));
  const flip = near.x < can.x;
  return flip === can.flip ? next : { ...next, studio: { ...next.studio, items: next.studio.items.map((i) => (i.uid === uid ? { ...i, flip } : i)) } };
}

/** Plants near the point grow one step: dry → watered → bloom. Returns the new save and how many plants drank. */
export function waterPlantsNear(s: SaveData, at: { x: number; y: number }): { save: SaveData; watered: number } {
  let watered = 0;
  const items = s.studio.items.map((i) => {
    const def = interactiveFor(i.itemId);
    if (def?.kind !== 'plant') return i;
    if (Math.abs(i.x - at.x) > WATER_REACH_X || Math.abs(i.y - at.y) > WATER_REACH_Y) return i;
    const cur = itemState(i)!;
    const next = cur === 'dry' ? 'watered' : 'bloom';
    if (next === cur) return i;
    watered++;
    return { ...i, state: next };
  });
  return { save: watered ? { ...s, studio: { ...s.studio, items } } : s, watered };
}
