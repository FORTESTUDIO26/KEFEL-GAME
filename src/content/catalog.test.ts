import { describe, expect, it } from 'vitest';
import * as catalog from './catalog';

// Frozen pre-rebalance fixtures: migration must never derive these from current prices.
const legacyWearables = ["party_hat","bow","heart_glasses","collar_classic","bandana","tee_stripes","sport_tank","socks","ribbon","flower_clip","sun_hat","headband","sunglasses","bell_ribbon","polka_bandana","hoodie","flowy_dress","knit_vest","ballet_shoes","big_bow","handbag","bouquet"];
const legacyFurniture = ["sofa","mirror_tall","floor_lamp","rug_round","plant_monstera","clothes_rack","dog_bed","frame","loveseat","cozy_chair","pouf","cushions","dressing_table","arch_mirror","wall_shelves","hat_rack","rug_fluffy","rug_rect","side_lamp","wall_lamp","hanging_plant","flower_pot","star_garland","heart_wall","round_dog_bed","paw_poster"];

describe('catalog coin pricing contract', () => {
  it('grants exactly the six approved starters in each collection', () => {
    expect([...catalog.FREE_WEARABLES].sort()).toEqual(['collar_classic', 'bandana', 'tee_stripes', 'sport_tank', 'socks', 'ribbon'].sort());
    expect([...catalog.FREE_FURNITURE].sort()).toEqual(['sofa', 'mirror_tall', 'rug_round', 'plant_monstera', 'frame', 'dog_bed'].sort());
    expect(catalog.FREE_BACKGROUNDS).toEqual(['wall_plain', 'wall_stripes', 'floor_wood']);
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
      ['wearable', legacyWearables, ['collar_classic', 'bandana', 'tee_stripes', 'sport_tank', 'socks', 'ribbon'] as string[]],
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
