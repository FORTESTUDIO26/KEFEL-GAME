import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DogFigure } from '../art/Dog';
import { FurnitureArt } from '../art/Furniture';
import { RoomBackground } from '../art/Scenes';
import { DOGS } from './dogs';
import { shade } from '../art/color';
import { describe, expect, it } from 'vitest';
import * as catalog from './catalog';
import { KITCHEN_STARTER_IDS } from './kitchenLayout';

// Frozen pre-rebalance fixtures: migration must never derive these from current prices.
const legacyWearables = ["party_hat","bow","heart_glasses","collar_classic","bandana","tee_stripes","sport_tank","socks","ribbon","flower_clip","sun_hat","headband","sunglasses","bell_ribbon","polka_bandana","hoodie","flowy_dress","knit_vest","ballet_shoes","big_bow","handbag","bouquet"];
const legacyFurniture = ["sofa","mirror_tall","floor_lamp","rug_round","plant_monstera","clothes_rack","dog_bed","frame","loveseat","cozy_chair","pouf","cushions","dressing_table","arch_mirror","wall_shelves","hat_rack","rug_fluffy","rug_rect","side_lamp","wall_lamp","hanging_plant","flower_pot","star_garland","heart_wall","round_dog_bed","paw_poster"];

describe('catalog coin pricing contract', () => {
  it('preserves all original starters alongside new free variants', () => {
    expect(catalog.FREE_WEARABLES.filter(id => !catalog.wearableById(id)?.baseId).sort()).toEqual(['collar_classic', 'bow', 'tee_stripes', 'sport_tank', 'socks', 'ribbon'].sort());
    expect(catalog.FREE_FURNITURE.filter(id => !catalog.furnitureById(id)?.baseId && !/^(kitchen_|bath_|yard_)/.test(id)).sort()).toEqual(['sofa', 'mirror_tall', 'rug_round', 'plant_monstera', 'frame', 'dog_bed'].sort());
    expect(catalog.FREE_BACKGROUNDS.filter(id => !catalog.backgroundById(id)?.baseId)).toEqual(['wall_plain', 'wall_stripes', 'floor_wood']);
  });

  it('exports every original free ID for old-save ownership migration', () => {
    expect(catalog).toHaveProperty('LEGACY_FREE_WEARABLES', legacyWearables);
    expect(catalog).toHaveProperty('LEGACY_FREE_FURNITURE', legacyFurniture);
    expect(legacyWearables).toHaveLength(22);
    expect(legacyFurniture).toHaveLength(26);
  });

  it('charges 10–40 earned coins in multiples of five and keeps backgrounds affordable', () => {
    for (const item of [...catalog.WEARABLES, ...catalog.FURNITURE, ...catalog.BACKGROUNDS]) {
      if (item.price === 0) continue;
      expect(item.price, item.id).toBeGreaterThanOrEqual(10);
      expect(item.price, item.id).toBeLessThanOrEqual(40);
      expect(item.price % 5, item.id).toBe(0);
    }
    const specials = new Set(['crown', 'evening_jacket', 'leotard', 'wings', 'stage_bun', 'hoop', 'gym_ball', 'clubs', 'rope', 'vanity', 'chandelier', 'bathtub', 'runway', 'neon', 'gym_mat', 'ribbon_stand']);
    for (const item of [...catalog.WEARABLES, ...catalog.FURNITURE]) {
      if (item.price === 0) continue;
      if (specials.has(item.id)) expect(item.price, item.id).toBeGreaterThanOrEqual(30);
      else expect(item.price, item.id).toBeLessThanOrEqual(20);
    }
    for (const item of catalog.BACKGROUNDS) expect(item.price, item.id).toBeLessThanOrEqual(20);
  });

  it('prices previously free non-starters at 10–15 coins', () => {
    for (const [kind, ids, starters] of [
      ['wearable', legacyWearables, ['collar_classic', 'bow', 'tee_stripes', 'sport_tank', 'socks', 'ribbon'] as string[]],
      ['furniture', legacyFurniture, ['sofa', 'mirror_tall', 'rug_round', 'plant_monstera', 'frame', 'dog_bed'] as string[]],
    ] as const) {
      for (const id of ids.filter(id => !starters.includes(id))) {
        expect(catalog.priceOf(kind, id), id).toBeGreaterThanOrEqual(10);
        expect(catalog.priceOf(kind, id), id).toBeLessThanOrEqual(15);
      }
    }
  });

  it('offers regular purchases after one round while keeping statement pieces special', () => {
    expect(catalog.priceOf('wearable', 'beret')).toBe(15);
    expect(catalog.priceOf('wearable', 'crown')).toBe(30);
    expect(catalog.priceOf('wearable', 'leotard')).toBe(30);
    expect(catalog.priceOf('furniture', 'runway')).toBe(40);
    expect(catalog.priceOf('furniture', 'chandelier')).toBe(35);
    expect(catalog.priceOf('background', 'wall_hearts')).toBe(20);
  });
});

it('adds five free and two rare variants to every category', () => {
 const groups = [...catalog.SLOT_ORDER.map(slot => ({items: catalog.WEARABLES.filter(x => x.slot === slot), free: catalog.FREE_WEARABLES})), ...(['floor','wall','rug','ceiling'] as const).map(kind => ({items: catalog.FURNITURE.filter(x => x.kind === kind), free: catalog.FREE_FURNITURE})), ...(['wall','floor'] as const).map(type => ({items: catalog.BACKGROUNDS.filter(x => x.type === type), free: catalog.FREE_BACKGROUNDS}))];
 for (const {items,free} of groups) { expect(items.filter(x => x.baseId && !x.rare)).toHaveLength(5); expect(items.filter(x => x.rare)).toHaveLength(2); for (const x of items.filter(x => x.baseId)) {expect(x.price).toBe(0);expect(x.color).toMatch(/^#[0-9a-f]{6}$/i);expect(/[א-ת]/.test(x.name)).toBe(true);expect(free.includes(x.id)).toBe(!x.rare);} }
 expect(catalog.FREE_WEARABLES).toHaveLength(41);expect(catalog.FREE_FURNITURE.filter(id => !KITCHEN_STARTER_IDS.includes(id))).toHaveLength(38);expect(catalog.FREE_BACKGROUNDS).toHaveLength(13);expect(catalog.RARE_ITEMS).toHaveLength(26);expect(new Set(catalog.RARE_ITEMS.map(x => x.category)).size).toBe(13);
 const all=[...catalog.WEARABLES,...catalog.FURNITURE,...catalog.BACKGROUNDS];expect(new Set(all.map(x=>x.id)).size).toBe(all.length);
});

const render = <P extends object>(component: ComponentType<P>, props: P) => renderToStaticMarkup(createElement('svg', null, createElement(component, props))).replace(/^<svg>/, '').replace(/<\/svg>$/, '');
it('renders every new wearable with real family geometry on every dog without changing ownership IDs', () => {
 for (const dog of DOGS) {
  const bare = render(DogFigure, {dog});
  for (const item of catalog.WEARABLES.filter(x => x.baseId)) {
   const outfit = {[item.slot]: {itemId:item.id, color:item.color}};
   const html = render(DogFigure, {dog,outfit});
   const base = render(DogFigure, {dog,outfit:{[item.slot]:{itemId:item.baseId,color:item.color}}});
   expect(html, item.id).not.toBe(bare);
   expect(html, item.id).toContain(item.color);
   if (!item.rare) expect(html, item.id).toBe(base);
   else {expect(html, item.id).toContain('data-variant-decal="rare"');expect(html, item.id).toContain('#f2c14e');}
   expect(outfit[item.slot].itemId).toBe(item.id);
   expect(catalog.wearableById(item.baseId!)?.slot).toBe(item.slot);
  }
 }
});
it('renders every new furniture variant using its original SVG rather than an empty fallback', () => {
 for (const item of catalog.FURNITURE.filter(x => x.baseId)) {
  const base=render(FurnitureArt,{id:item.baseId!,p:catalog.PALETTES[0],color:item.color});
  const html=render(FurnitureArt,{id:item.id,p:catalog.PALETTES[0]});
  expect(base.length,item.id).toBeGreaterThan(100);
  expect(html,item.id).toContain(base);
  expect(base,item.id).not.toBe(render(FurnitureArt,{id:item.baseId!,p:catalog.PALETTES[0]}));
  expect(html,item.id).toContain(item.rare ? 'data-variant-decal="rare"' : 'data-variant-decal="atelier"');
  expect(catalog.furnitureById(item.baseId!)).toMatchObject({kind:item.kind,w:item.w,h:item.h});
 }
});
it('renders every new background with its own palette and inherited pattern', () => {
 for (const item of catalog.BACKGROUNDS.filter(x => x.baseId)) {
  const wall=item.type==='wall' ? item.id : 'wall_plain';
  const floor=item.type==='floor' ? item.id : 'floor_wood';
  const html=render(RoomBackground,{wall,floor,p:catalog.PALETTES[0]});
  expect(html,item.id).toContain(item.type === 'floor' ? shade(item.color!,0.65) : shade(item.color!,0.8));
  const p={...catalog.PALETTES[0],...(item.type==='wall' ? {wall:shade(item.color!,0.8),wallAccent:item.color!} : {floor:shade(item.color!,0.65),floorAccent:item.color!,soft:shade(item.color!,0.8),accent:item.color!})};
  const base=render(RoomBackground,{wall:item.type==='wall'?item.baseId!:wall,floor:item.type==='floor'?item.baseId!:floor,p});
  // Pattern geometry must survive alias resolution, including hearts, ribbons and wood seams.
  const paths=(markup:string)=>[...markup.matchAll(/ d="([^"]+)"/g)].map(x=>x[1]);
  for(const d of paths(base)) expect(paths(html),item.id).toContain(d);
  if(item.rare) expect(html,item.id).toContain('data-variant-decal="rare"');
  expect(catalog.backgroundById(item.baseId!)?.type).toBe(item.type);
 }
});


const householdIds = [
 'kitchen_stove', 'kitchen_fridge', 'kitchen_sink', 'kitchen_pots', 'kitchen_cups',
 'kitchen_table', 'kitchen_kettle', 'kitchen_toaster', 'kitchen_plates', 'kitchen_bread',
 'bath_shower', 'bath_tub', 'bath_towel', 'bath_soap', 'bath_laundry', 'bath_sink', 'bath_mirror', 'bath_mat',
 'yard_swing', 'yard_wateringcan', 'yard_bench', 'yard_birdhouse', 'yard_planter', 'yard_lantern',
];
it('adds original household families with twelve free and twelve paid pieces', () => {
 const items = householdIds.map(id => catalog.furnitureById(id)!);
 expect(items.every(Boolean)).toBe(true);
 expect(items.filter(x => x.price === 0)).toHaveLength(12);
 expect(items.filter(x => x.price >= 10 && x.price <= 30)).toHaveLength(12);
 const drawings: string[] = [];
 for (const x of items) {
  expect(x.baseId).toBeUndefined();
  if (x.price === 0) expect(catalog.FREE_FURNITURE).toContain(x.id);
  const html = render(FurnitureArt, {id: x.id, p: catalog.PALETTES[0]});
  expect(html).toContain('data-household-object="' + x.id + '"');
  expect(html.length).toBeGreaterThan(180);
  drawings.push(html.replace(/data-household-object="[^"]+"/, ''));
 }
 expect(new Set(drawings).size).toBe(24);
});
it('classifies all furniture including base variants', () => {
 expect(catalog).toHaveProperty('furnitureCategory');
 for (const x of catalog.FURNITURE) {
  expect(['seating','decor','textiles','lighting','kitchen','bath','yard','storage']).toContain(catalog.furnitureCategory(x));
  if (x.baseId) expect(catalog.furnitureCategory(x)).toBe(catalog.furnitureCategory(catalog.furnitureById(x.baseId)!));
 }
 for (const [id, category] of [['sofa','seating'], ['rug_round','textiles'], ['floor_lamp','lighting'], ['shelf','storage'], ['frame','decor'], ['bathtub','bath'], ['bowl','kitchen'], ['yard_swing','yard']] as const) {
  expect(catalog.furnitureCategory(catalog.furnitureById(id)!)).toBe(category);
 }
});
