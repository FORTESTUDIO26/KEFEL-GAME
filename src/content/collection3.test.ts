import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DogFigure } from '../art/Dog';
import { FurnitureArt } from '../art/Furniture';
import { EXTRA_FURNITURE_ART, EXTRA_WEARABLE_ART } from '../art/extraArt';
import { resolveDrop } from '../state/placement';
import type { PlacedItem, RoomLayout } from '../state/types';
import { DOGS } from './dogs';
import {
  FREE_FURNITURE, FURNITURE, PALETTES, WEARABLES, furnitureById, furnitureCategory, wearableById,
} from './catalog';
import { KITCHEN_STARTER, KITCHEN_STARTER_IDS } from './kitchenLayout';

const NEW_FURNITURE = [
  'kitchen_counter', 'kitchen_counter_drawers', 'kitchen_sink_counter', 'kitchen_oven_range', 'kitchen_fridge_tall',
  'kitchen_upper', 'kitchen_family_table', 'kitchen_chair', 'kitchen_pan', 'kitchen_fruit_bowl', 'kitchen_tray',
  'kitchen_cake', 'kitchen_jars', 'kitchen_cutlery', 'kitchen_mixing_bowl', 'kitchen_treat_jar', 'kitchen_spice_rack',
  'kitchen_rug', 'rg_podium', 'rg_trophy', 'rg_spotlight', 'rg_carpet', 'rg_stage_curtain', 'rg_medal_board',
  'dance_boombox', 'dance_speaker', 'dance_floor', 'dance_disco_ball', 'dance_dj_booth', 'dance_graffiti',
];
const NEW_WEARABLES = [
  'rg_star_ribbon', 'rg_glitter_hoop', 'rg_star_ball', 'rg_heart_clubs', 'rg_competition_leotard', 'rg_gold_medal',
  'rg_tiara', 'rg_half_shoes', 'dance_tracksuit', 'dance_twirl_skirt', 'dance_hightops', 'dance_snapback',
  'dance_neck_headphones', 'dance_sweatband', 'dance_disco_shades', 'dance_mic',
];
const NEW_SMALL = [
  'kitchen_pan', 'kitchen_fruit_bowl', 'kitchen_tray', 'kitchen_cake', 'kitchen_jars', 'kitchen_cutlery',
  'kitchen_mixing_bowl', 'kitchen_treat_jar', 'rg_trophy', 'dance_boombox',
];
const newFurniture = NEW_FURNITURE.map((id) => furnitureById(id)!);
const newWearables = NEW_WEARABLES.map((id) => wearableById(id)!);
const newItems = [...newFurniture, ...newWearables];

const svg = <P extends object>(c: ComponentType<P>, props: P) =>
  renderToStaticMarkup(createElement('svg', null, createElement(c, props)));

const placed = (uid: string, itemId: string, extra: Partial<PlacedItem> = {}): PlacedItem =>
  ({ uid, itemId, x: 300, y: 400, scale: 1, flip: false, ...extra });
const room = (...items: PlacedItem[]): RoomLayout =>
  ({ wall: 'wall_stripes', floor: 'floor_wood', items, dog: { x: 100, y: 450 } });

describe('collection 3 catalog', () => {
  it('declares every new item exactly once with a Hebrew name', () => {
    expect(newItems.every(Boolean)).toBe(true);
    const all = [...WEARABLES, ...FURNITURE].map((x) => x.id);
    expect(new Set(all).size).toBe(all.length);
    for (const item of newItems) {
      expect(/[א-ת]/.test(item.name), item.id).toBe(true);
      expect(item.baseId, item.id).toBeUndefined();
    }
  });

  it('has a full kitchen category with free modules and affordable extras', () => {
    const kitchen = FURNITURE.filter((f) => !f.baseId && furnitureCategory(f) === 'kitchen');
    expect(kitchen.length).toBeGreaterThanOrEqual(15);
    const required: Record<string, string[]> = {
      table: ['kitchen_family_table', 'kitchen_table'], chairs: ['kitchen_chair'], plates: ['kitchen_plates'],
      cups: ['kitchen_cups'], cutlery: ['kitchen_cutlery'], pot: ['kitchen_pots'], pan: ['kitchen_pan'],
      kettle: ['kitchen_kettle'], bowl: ['kitchen_mixing_bowl'], tray: ['kitchen_tray'], fruit: ['kitchen_fruit_bowl'],
      cake: ['kitchen_cake'], jars: ['kitchen_jars', 'kitchen_treat_jar'],
    };
    for (const [what, ids] of Object.entries(required)) {
      for (const id of ids) expect(furnitureCategory(furnitureById(id)!), `${what}: ${id}`).toBe('kitchen');
    }
    expect(kitchen.some((f) => f.price === 0)).toBe(true);
    expect(kitchen.filter((f) => f.price >= 5 && f.price <= 30).length).toBeGreaterThanOrEqual(10);
  });

  it('adds at least ten new pieces to each of the gymnastics and dance collections', () => {
    expect(newItems.filter((x) => x.rg).length).toBeGreaterThanOrEqual(10);
    expect(newItems.filter((x) => x.dance).length).toBeGreaterThanOrEqual(10);
    expect(newItems.filter((x) => x.rg && x.dance)).toHaveLength(0);
    for (const x of newItems.filter((x) => x.rg || x.dance)) expect(x.price, x.id).toBeGreaterThan(0);
  });

  it('adds at least thirty new paid items, all affordable', () => {
    const paid = newItems.filter((x) => x.price > 0);
    expect(paid.length).toBeGreaterThanOrEqual(30);
    for (const x of paid) {
      expect(x.price, x.id).toBeGreaterThanOrEqual(5);
      expect(x.price, x.id).toBeLessThanOrEqual(90);
    }
    // only the starter kitchen modules are free
    expect(newItems.filter((x) => x.price === 0).map((x) => x.id).sort()).toEqual([...KITCHEN_STARTER_IDS].sort());
  });

  it('gives every new furniture piece sensible size and kind', () => {
    for (const f of newFurniture) {
      expect(['floor', 'wall', 'rug', 'ceiling'], f.id).toContain(f.kind);
      expect(f.w, f.id).toBeGreaterThan(20);
      expect(f.h, f.id).toBeGreaterThan(20);
      expect(f.w, f.id).toBeLessThanOrEqual(320);
      expect(f.h, f.id).toBeLessThanOrEqual(240);
    }
  });
});

describe('collection 3 drawings', () => {
  it('registers and renders a non-empty drawing for every new furniture piece', () => {
    for (const f of newFurniture) {
      expect(EXTRA_FURNITURE_ART[f.id], f.id).toBeTypeOf('function');
      for (const p of PALETTES) {
        const html = svg(FurnitureArt, { id: f.id, p });
        expect(html, f.id).toContain(`data-content-id="${f.id}"`);
        expect(html.length, f.id).toBeGreaterThan(250);
        expect(html, f.id).not.toMatch(/NaN|undefined|Infinity/);
      }
      expect(svg(FurnitureArt, { id: f.id, p: PALETTES[0], color: '#7fdcaa' }), f.id).not.toMatch(/NaN|undefined/);
    }
  });

  it('fits every new wearable on small, medium, large and long dogs', () => {
    const builds = ['small', 'medium', 'large', 'long'] as const;
    for (const build of builds) {
      const dog = DOGS.find((d) => d.build === build)!;
      expect(dog, build).toBeTruthy();
      for (const w of newWearables) {
        expect(EXTRA_WEARABLE_ART[w.id], w.id).toBeTruthy();
        for (const mood of ['idle', 'sit'] as const) {
          const html = svg(DogFigure, { dog, mood, asGroup: true, outfit: { [w.slot]: { itemId: w.id, color: w.color } } });
          expect(html, `${w.id} on ${build}`).not.toBe(svg(DogFigure, { dog, mood, asGroup: true }));
          expect(html, `${w.id} on ${build}`).toContain(w.color);
          expect(html, `${w.id} on ${build}`).not.toMatch(/NaN|undefined|Infinity/);
          const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
          expect(new Set(ids).size).toBe(ids.length);
          for (const ref of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref[1]);
        }
      }
    }
  });
});

describe('collection 3 placement', () => {
  it('lets every new small object snap onto a kitchen counter', () => {
    for (const id of NEW_SMALL) {
      const r = room(placed('counter', 'kitchen_counter'), placed('obj', id, { x: 600, y: 470 }));
      expect(resolveDrop(r, 'obj', { x: 305, y: 400 - 112 + 6 }), id).toEqual({ x: 305, y: 288, supportUid: 'counter' });
    }
  });

  it('puts every worktop at the same height so modules line up', () => {
    for (const id of ['kitchen_counter', 'kitchen_counter_drawers', 'kitchen_sink_counter', 'kitchen_oven_range']) {
      const r = room(placed('host', id), placed('cup', 'kitchen_plates'));
      const drop = resolveDrop(r, 'cup', { x: 300, y: 292 });
      expect(drop.supportUid, id).toBe('host');
      expect(400 - drop.y, id).toBeGreaterThanOrEqual(105);
      expect(400 - drop.y, id).toBeLessThanOrEqual(115);
    }
  });

  it.each([
    ['kitchen_family_table', 300, 96], ['kitchen_upper', 300, 84], ['kitchen_fridge_tall', 300, 220],
    ['dance_dj_booth', 300, 100], ['rg_podium', 300, 104], ['rg_podium', 230, 74], ['rg_podium', 370, 54],
  ] as const)('accepts small items on %s', (host, x, height) => {
    const r = room(placed('host', host), placed('t', 'rg_trophy'));
    expect(resolveDrop(r, 't', { x, y: 400 - height + 4 })).toEqual({ x, y: 400 - height, supportUid: 'host' });
  });

  it('keeps kitchen proportions believable next to the dog and children', () => {
    const top = (id: string) => furnitureById(id)!.h;
    expect(top('kitchen_fridge_tall')).toBeGreaterThanOrEqual(210);
    expect(top('kitchen_fridge_tall')).toBeLessThanOrEqual(230);
    // table top below the worktop, chair seat well below the table
    expect(top('kitchen_family_table')).toBeLessThan(top('kitchen_counter'));
    expect(top('kitchen_counter')).toBeGreaterThanOrEqual(105);
    expect(top('kitchen_counter')).toBeLessThanOrEqual(116);
    expect(top('kitchen_chair')).toBeLessThan(top('kitchen_fridge_tall') / 1.8);
    expect(furnitureById('kitchen_upper')!.kind).toBe('wall');
  });
});

describe('kitchen starter layout', () => {
  const pieces = KITCHEN_STARTER.map((p) => ({ ...p, item: furnitureById(p.itemId)! }));
  it('uses only free, existing pieces that every player owns', () => {
    expect(pieces.length).toBeGreaterThanOrEqual(8);
    for (const p of pieces) {
      expect(p.item, p.itemId).toBeTruthy();
      expect(p.item.price, p.itemId).toBe(0);
      expect(FREE_FURNITURE, p.itemId).toContain(p.itemId);
      expect(furnitureCategory(p.item), p.itemId).toBe('kitchen');
    }
    for (const id of ['kitchen_counter', 'kitchen_sink_counter', 'kitchen_oven_range', 'kitchen_fridge_tall', 'kitchen_upper', 'kitchen_family_table', 'kitchen_chair']) {
      expect(KITCHEN_STARTER.some((p) => p.itemId === id), id).toBe(true);
    }
  });

  it('stays inside the visible kitchen with floor and wall pieces at sensible heights', () => {
    for (const p of pieces) {
      const half = (p.item.w * (p.scale ?? 1)) / 2;
      expect(p.x - half, p.itemId).toBeGreaterThanOrEqual(0);
      expect(p.x + half, p.itemId).toBeLessThanOrEqual(820);
      if (p.item.kind === 'wall') {
        expect(p.y, p.itemId).toBeGreaterThanOrEqual(200);
        expect(p.y, p.itemId).toBeLessThanOrEqual(260);
      } else {
        expect(p.y, p.itemId).toBeGreaterThanOrEqual(400);
        expect(p.y, p.itemId).toBeLessThanOrEqual(470);
      }
    }
    // wall cabinets hang clearly above the worktop
    const worktopY = 420 - 112;
    for (const p of pieces.filter((p) => p.item.kind === 'wall')) expect(p.y).toBeLessThan(worktopY - 40);
  });

  it('does not overlap pieces badly', () => {
    const floor = pieces.filter((p) => p.item.kind === 'floor');
    for (let i = 0; i < floor.length; i++) for (let j = i + 1; j < floor.length; j++) {
      const a = floor[i], b = floor[j];
      if (Math.abs(a.y - b.y) > 30) continue;
      const wa = a.item.w * (a.scale ?? 1), wb = b.item.w * (b.scale ?? 1);
      const overlap = Math.min(a.x + wa / 2, b.x + wb / 2) - Math.max(a.x - wa / 2, b.x - wb / 2);
      const sameRun = a.y === 420 && b.y === 420;
      expect(overlap, `${a.itemId} × ${b.itemId}`).toBeLessThanOrEqual(sameRun ? 1 : Math.min(wa, wb) * 0.35);
    }
    const walls = pieces.filter((p) => p.item.kind === 'wall');
    for (let i = 0; i < walls.length; i++) for (let j = i + 1; j < walls.length; j++) {
      expect(Math.abs(walls[i].x - walls[j].x)).toBeGreaterThanOrEqual(walls[i].item.w);
    }
  });
});
