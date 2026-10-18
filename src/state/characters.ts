import { ITEM_MAX_X, ITEM_MIN_X } from '../art/roomSpan';
// Guest dogs and people in rooms. They are stored as placed entries with a special item id
// ("guest:<dogId>" / "human:<humanId>"), so moving, seating on a sofa or dog bed, layers and
// removal use the same code as furniture. They never touch learning data, and a guest dog
// never replaces the room's own dog.
import { dogById, STARTER_DOG_IDS } from '../content/dogs';
import { HUMANS, humanById, humanWearableById, type HumanOutfit, type HumanSlot } from '../content/humans';
import type { PlacedItem, SaveData } from './types';
import { familyById } from '../content/family';

export const GUEST_PREFIX = 'guest:';
export const HUMAN_PREFIX = 'human:';
/** the family illustrations (content/family.ts): they stand, and are never mirrored or resized */
export const FAMILY_PREFIX = 'family:';
/** Characters per room, so a small phone stays fast and the room readable. */
export const MAX_CHARACTERS = 8;
/** rendering scale of dogs in rooms (the same as the room's own dog) */
export const CHARACTER_DOG_SCALE = 0.56;
/** people are drawn a little smaller than life next to the room's dogs */
export const HUMAN_SCALE = 0.62;

export type CharacterRef = { kind: 'dog' | 'human' | 'family'; id: string };

export function characterOf(itemId: string): CharacterRef | null {
  if (itemId.startsWith(GUEST_PREFIX)) {
    const id = itemId.slice(GUEST_PREFIX.length);
    return STARTER_DOG_IDS.includes(id) ? { kind: 'dog', id } : null;
  }
  if (itemId.startsWith(FAMILY_PREFIX)) {
    const id = itemId.slice(FAMILY_PREFIX.length);
    return familyById(id) ? { kind: 'family', id } : null;
  }
  if (itemId.startsWith(HUMAN_PREFIX)) {
    const id = itemId.slice(HUMAN_PREFIX.length);
    return humanById(id) ? { kind: 'human', id } : null;
  }
  return null;
}

export const isCharacter = (itemId: string) => characterOf(itemId) !== null;

export function characterName(itemId: string): string {
  const c = characterOf(itemId);
  if (!c) return '';
  return c.kind === 'dog' ? dogById(c.id).name : c.kind === 'family' ? familyById(c.id)!.name : humanById(c.id)!.name;
}

/** Half the width of the feet contact, for snapping onto seats. */
export function characterHalfWidth(itemId: string): number {
  const c = characterOf(itemId);
  return c?.kind === 'human' ? 24 : 32;
}

export function charactersIn(items: PlacedItem[]): PlacedItem[] {
  return items.filter((p) => isCharacter(p.itemId));
}

/** Add a guest dog or a person to the current room (save.studio). */
/** `centerX`: the middle of what the player sees; new characters line up around it. */
export function addCharacter(save: SaveData, itemId: string, now: number, centerX?: number): SaveData {
  const c = characterOf(itemId);
  if (!c) return save;
  const room = save.studio;
  if (c.kind === 'dog' && c.id === save.profile.ownDogId) return save; // the room's own dog is already here
  if (room.items.some((p) => p.itemId === itemId)) return save;
  const count = charactersIn(room.items).length;
  if (count >= MAX_CHARACTERS) return save;
  const x = centerX !== undefined && Number.isFinite(centerX)
    ? Math.min(ITEM_MAX_X, Math.max(ITEM_MIN_X, centerX - 180 + ((count * 110) % 440)))
    : 140 + ((count * 120) % 960);
  const item: PlacedItem = { uid: `c${now.toString(36)}`, itemId, x, y: 468, scale: 1, flip: c.kind !== 'family' && count % 2 === 1 };
  return { ...save, studio: { ...save.studio, items: [...room.items, item] } };
}

export function setHumanOutfit(save: SaveData, uid: string, slot: HumanSlot, itemId: string | null): SaveData {
  const p = save.studio.items.find((i) => i.uid === uid);
  const c = p && characterOf(p.itemId);
  if (!p || c?.kind !== 'human') return save;
  const human = humanById(c.id)!;
  const current: HumanOutfit = { ...(p.outfit ?? human.defaultOutfit) };
  if (itemId === null) delete current[slot];
  else {
    const w = humanWearableById(itemId);
    if (!w || w.slot !== slot) return save;
    current[slot] = { itemId, color: current[slot]?.itemId === itemId ? current[slot]!.color : w.color };
  }
  return { ...save, studio: { ...save.studio, items: save.studio.items.map((i) => (i.uid === uid ? { ...i, outfit: current } : i)) } };
}

export function sanitizeHumanOutfit(v: unknown): HumanOutfit | undefined {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined;
  const out: HumanOutfit = {};
  for (const [slot, piece] of Object.entries(v as Record<string, unknown>)) {
    if (typeof piece !== 'object' || piece === null) continue;
    const { itemId, color } = piece as { itemId?: unknown; color?: unknown };
    const w = typeof itemId === 'string' ? humanWearableById(itemId) : undefined;
    if (!w || w.slot !== slot) continue;
    out[slot as HumanSlot] = { itemId: w.id, color: typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : w.color };
  }
  return out;
}

export const GUEST_DOG_CHOICES = STARTER_DOG_IDS;
export const HUMAN_CHOICES = HUMANS.map((h) => h.id);
