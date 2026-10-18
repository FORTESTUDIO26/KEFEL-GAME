// Room objects a child can tap to change. The drawings read the state through
// <FurnitureArt state={...} /> (art/Furniture.tsx); the room screen owns which state each placed
// object is in. Variants (items with a baseId) behave like their original — use interactiveFor().
import { furnitureById } from './catalog';

export type InteractiveKind = 'toggle' | 'water-source' | 'watering-can' | 'plant';

export interface InteractiveDef {
  kind: InteractiveKind;
  /** every state the drawing knows, in tap order */
  states: string[];
  /** the resting look (what the drawing shows when no state is given) */
  initial: string;
}

const toggle: InteractiveDef = { kind: 'toggle', states: ['off', 'on'], initial: 'off' };
const tap: InteractiveDef = { kind: 'water-source', states: ['off', 'on'], initial: 'off' };
const plant: InteractiveDef = { kind: 'plant', states: ['dry', 'watered', 'bloom'], initial: 'watered' };
/** flowers already open in the shop picture */
const flowers: InteractiveDef = { ...plant, initial: 'bloom' };

export const INTERACTIVE: Record<string, InteractiveDef> = {
  // lights and gadgets
  floor_lamp: toggle,
  side_lamp: toggle,
  wall_lamp: toggle,
  studio_desk_lamp: toggle,
  studio_tv: toggle,
  studio_radio: toggle,
  // taps
  studio_wash_basin: tap,
  bath_sink: tap,
  kitchen_sink: tap,
  kitchen_sink_counter: tap,
  // the watering can
  studio_watering_can: { kind: 'watering-can', states: ['idle', 'pour'], initial: 'idle' },
  // plants
  plant_monstera: plant,
  plant_cactus: plant,
  hanging_plant: plant,
  studio_plant_small: plant,
  studio_plant_tall: plant,
  studio_succulent: plant,
  studio_cactus_small: plant,
  flower_pot: flowers,
  studio_vase: flowers,
};

/** The interactive definition for a placed item id, following variants back to their original. */
export function interactiveFor(itemId: string): InteractiveDef | undefined {
  const seen = new Set<string>();
  let id: string | undefined = itemId;
  while (id && !seen.has(id)) {
    if (INTERACTIVE[id]) return INTERACTIVE[id];
    seen.add(id);
    id = furnitureById(id)?.baseId;
  }
  return undefined;
}

/** The state after one tap (wraps around). Unknown states restart from the resting look. */
export function nextState(def: InteractiveDef, current: string | undefined): string {
  const i = def.states.indexOf(current ?? def.initial);
  return def.states[(i < 0 ? def.states.indexOf(def.initial) : i + 1) % def.states.length];
}
