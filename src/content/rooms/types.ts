// What one room adds to the game: new furniture, touchable things and how items sit on each other.
// Each room has its own file in this folder (so rooms can be designed side by side), merged in ./index.ts.
import type { Furniture } from '../catalog';
import type { InteractiveDef } from '../interactive';

/** [left, right, height above the bottom-centre origin], as fractions of the item's w / h (see state/placement.ts) */
export type SurfaceDef = readonly [number, number, number];

export interface RoomContent {
  /** new catalog items for this room; ids must start with `x_<room>_` (e.g. x_kitchen_oven) */
  furniture: Furniture[];
  /** touchable items: reuse the kinds in content/interactive.ts ('toggle', 'water-source', 'watering-can', 'plant') */
  interactive: Record<string, InteractiveDef>;
  /** tops other items can stand on */
  surfaces: Record<string, readonly SurfaceDef[]>;
  /** items characters sit on */
  seats: string[];
  /** small items that may stand on surfaces */
  small: string[];
}

export const emptyRoom = (): RoomContent => ({ furniture: [], interactive: {}, surfaces: {}, seats: [], small: [] });
