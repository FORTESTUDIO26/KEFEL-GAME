// A ready-made kitchen built only from free pieces, so every player owns all of it.
// Coordinates are the item's bottom-centre in the 800×500 room (floor ≈ y 330–500).
// Base modules share a 112-unit worktop and stand edge to edge; the sink sits under
// the kitchen window (x ≈ 330–470) and the wall cabinets hang ~60 units above the worktop.

export interface KitchenStarterPiece {
  itemId: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}

export const KITCHEN_STARTER: KitchenStarterPiece[] = [
  // wall cabinets first so floor pieces are drawn in front of them
  { itemId: 'kitchen_upper', x: 200, y: 230 },
  { itemId: 'kitchen_upper', x: 540, y: 230 },
  // one continuous run of base modules: 10 → 550
  { itemId: 'kitchen_fridge_tall', x: 60, y: 420 },
  { itemId: 'kitchen_counter', x: 170, y: 420 },
  { itemId: 'kitchen_oven_range', x: 280, y: 420 },
  { itemId: 'kitchen_sink_counter', x: 395, y: 420 },
  { itemId: 'kitchen_counter_drawers', x: 505, y: 420 },
  // dining corner
  { itemId: 'kitchen_family_table', x: 690, y: 456, scale: 0.85 },
  { itemId: 'kitchen_chair', x: 600, y: 462 },
  { itemId: 'kitchen_chair', x: 780, y: 462, flip: true },
];

/** Free kitchen modules added with the starter (they are granted to every player). */
export const KITCHEN_STARTER_IDS: string[] = [...new Set(KITCHEN_STARTER.map((p) => p.itemId))];
