import { describe, expect, it } from 'vitest';
import { addCharacter } from './characters';
import { placeFurniture } from './game';
import { defaultSave } from './save';
import { ITEM_MAX_X } from '../art/roomSpan';

const last = (s: { studio: { items: { x: number }[] } }) => s.studio.items[s.studio.items.length - 1];

describe('new things appear where the player is looking', () => {
  it('furniture and characters are placed around the middle of the screen, inside the room', () => {
    const s = defaultSave(1);
    const id = s.owned.furniture.find((f) => !s.studio.items.some((i) => i.itemId === f))!;
    const placed = placeFurniture(s, id, 2, 1300);
    expect(last(placed).x).toBe(1300);
    expect(last(placeFurniture(s, id, 2, 99999)).x).toBe(ITEM_MAX_X);
    const withGuest = addCharacter(s, 'human:maya', 3, -600);
    const x = last(withGuest).x;
    expect(x).toBeGreaterThan(-800);
    expect(x).toBeLessThan(-300);
  });
});
