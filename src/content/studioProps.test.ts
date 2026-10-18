import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FurnitureArt } from '../art/Furniture';
import { resolveDrop } from '../state/placement';
import type { PlacedItem, RoomLayout } from '../state/types';
import { FURNITURE, PALETTES, furnitureById, furnitureCategory } from './catalog';
import { INTERACTIVE, interactiveFor, nextState } from './interactive';

const studio = FURNITURE.filter((f) => f.id.startsWith('studio_'));
const svg = (id: string, state?: string) => renderToStaticMarkup(createElement('svg', null, createElement(FurnitureArt, { id, p: PALETTES[0], state })));
const placed = (uid: string, itemId: string, extra: Partial<PlacedItem> = {}): PlacedItem => ({ uid, itemId, x: 300, y: 400, scale: 1, flip: false, ...extra });
const room = (...items: PlacedItem[]): RoomLayout => ({ wall: 'wall_stripes', floor: 'floor_wood', items, dog: { x: 100, y: 450 } });

describe('studio props', () => {
  it('adds at least 20 cheap studio props with Hebrew names and drawings', () => {
    expect(studio.length).toBeGreaterThanOrEqual(20);
    for (const f of studio) {
      expect(f.price, f.id).toBeLessThanOrEqual(20);
      expect(/[א-ת]/.test(f.name), f.id).toBe(true);
      expect(f.category, f.id).toBe(furnitureCategory(f));
      const html = svg(f.id);
      expect(html, f.id).toContain(`data-content-id="${f.id}"`);
      expect(html.length, f.id).toBeGreaterThan(250);
      expect(html, f.id).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('lets small props stand on the new coffee table and the dog sit on the bean bag', () => {
    const r = room(placed('t', 'studio_coffee_table'), placed('m', 'studio_mug'), placed('b', 'studio_beanbag', { x: 600 }));
    expect(resolveDrop(r, 'm', { x: 300, y: 352 })).toEqual({ x: 300, y: 350, supportUid: 't' });
    expect(resolveDrop(r, '__dog__', { x: 600, y: 360 }).supportUid).toBe('b');
  });
});

describe('interactive art', () => {
  it('draws every state of every interactive item differently', () => {
    for (const [id, def] of Object.entries(INTERACTIVE)) {
      expect(furnitureById(id), id).toBeTruthy();
      expect(def.states, id).toContain(def.initial);
      const drawings = def.states.map((s) => svg(id, s));
      for (const d of drawings) expect(d, id).not.toMatch(/NaN|undefined/);
      expect(new Set(drawings).size, id).toBe(def.states.length);
    }
  });

  it('follows variants back to their original and cycles states', () => {
    expect(interactiveFor('atelier_furniture_floor_5')?.kind).toBe('plant');
    expect(interactiveFor('sofa')).toBeUndefined();
    const lamp = INTERACTIVE.floor_lamp;
    expect(nextState(lamp, undefined)).toBe('on');
    expect(nextState(lamp, 'on')).toBe('off');
    expect(nextState(INTERACTIVE.plant_monstera, 'bloom')).toBe('dry');
  });
});
