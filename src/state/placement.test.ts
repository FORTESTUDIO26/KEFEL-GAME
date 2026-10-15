import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../content/catalog';
import { defaultSave } from './save';
import type { PlacedItem, RoomLayout } from './types';
import { detachSupports, isValidSupport, moveWithSupports, resolveDrop } from './placement';

const placed = (uid:string, itemId:string, extra:Partial<PlacedItem> = {}):PlacedItem =>
  ({ uid, itemId, x:300, y:400, scale:1, flip:false, ...extra });
const room = (...items:PlacedItem[]):RoomLayout =>
  ({ wall:'wall_stripes', floor:'floor_wood', items, dog:{x:300,y:400} });
const saveWith = (layout:RoomLayout) => ({...defaultSave(1), studio:layout});

describe('surface drops', () => {
  it('snaps a cup bottom to the tabletop and clamps its full width', () => {
    const r=room(placed('table','kitchen_table'), placed('cup','kitchen_cups'));
    expect(resolveDrop(r,'cup',{x:370,y:345})).toEqual({x:342,y:330,supportUid:'table'});
    expect(resolveDrop(r,'cup',{x:310,y:371})).toEqual({x:310,y:371});
    expect(resolveDrop(r,'cup',{x:500,y:330})).toEqual({x:500,y:330});
  });
  it('preserves free drops, invalid UIDs, and disallows large furniture stacking', () => {
    const r=room(placed('table','kitchen_table'),placed('sofa','sofa'));
    expect(resolveDrop(r,'sofa',{x:300,y:330})).toEqual({x:300,y:330});
    expect(resolveDrop(r,'missing',{x:300,y:330})).toEqual({x:300,y:330});
  });
  it('lets the dog rest on a bed but never the stove or tabletop', () => {
    expect(resolveDrop(room(placed('bed','dog_bed')),'__dog__',{x:300,y:380}))
      .toEqual({x:300,y:374,supportUid:'bed'});
    for (const itemId of ['kitchen_stove','kitchen_table']) {
      const point={x:300,y:itemId==='kitchen_stove'?268:330};
      expect(resolveDrop(room(placed('host',itemId)),'__dog__',point)).toEqual(point);
    }
  });
  it('uses base geometry for variants with scaled and flipped hosts and children', () => {
    const variant=FURNITURE.find(f=>f.baseId==='kitchen_table');
    // Some collections have no kitchen variant; the sofa collection always has one.
    const sofaVariant=FURNITURE.find(f=>f.baseId==='sofa')!;
    const r=room(placed('host',variant?.id??'kitchen_table',{scale:2,flip:true}),
      placed('cup','kitchen_cups',{scale:0.5,flip:true}));
    expect(resolveDrop(r,'cup',{x:470,y:270})).toEqual({x:456,y:260,supportUid:'host'});
    expect(resolveDrop(room(placed('seat',sofaVariant.id,{scale:2,flip:true})),'__dog__',{x:300,y:280}))
      .toEqual({x:300,y:276,supportUid:'seat'});
  });
  it('uses each shelf level and rejects objects wider than the surface', () => {
    const r=room(placed('s','wall_shelves'),placed('p','kitchen_plates'));
    expect(resolveDrop(r,'p',{x:300,y:345})).toEqual({x:300,y:342,supportUid:'s'});
    expect(resolveDrop(r,'p',{x:300,y:393})).toEqual({x:300,y:392,supportUid:'s'});
    r.items[1].scale=3;
    expect(resolveDrop(r,'p',{x:300,y:342})).toEqual({x:300,y:342});
  });
  it('chooses the closest surface and never snaps to an absent host', () => {
    const r=room(placed('far','kitchen_table',{y:420}),placed('near','kitchen_table'),placed('p','kitchen_plates'));
    expect(resolveDrop(r,'p',{x:300,y:333}).supportUid).toBe('near');
    expect(isValidSupport(r,'p','absent')).toBe(false);
    expect(isValidSupport(r,'p','p')).toBe(false);
    expect(isValidSupport(r,'__dog__','near')).toBe(false);
    expect(isValidSupport(r,'p','near')).toBe(true);
  });
  it.each([
    ['sofa',338], ['loveseat',338], ['armchair',334], ['cozy_chair',374],
    ['round_dog_bed',372], ['yard_bench',352],
  ])('snaps dog feet to the original %s seat surface', (itemId,y) => {
    expect(resolveDrop(room(placed('seat',itemId)),'__dog__',{x:300,y:y+5}))
      .toEqual({x:300,y,supportUid:'seat'});
  });
  it('snaps pots to the counter and rejects a proposed descendant attachment', () => {
    const r=room(placed('counter','kitchen_sink'),placed('pot','kitchen_pots'));
    expect(resolveDrop(r,'pot',{x:300,y:310})).toEqual({x:300,y:307,supportUid:'counter'});
    const nested=room(placed('cup','kitchen_cups'),placed('table','kitchen_table',{supportUid:'cup'}));
    expect(isValidSupport(nested,'cup','table')).toBe(false);
    expect(resolveDrop(nested,'cup',{x:300,y:330})).toEqual({x:300,y:330});
  });
});

describe('support movement and removal', () => {
  it('carries a whole support chain and dog without mutating or snapping', () => {
    const r=room(placed('a','kitchen_table'),placed('b','shelf',{x:310,y:330,supportUid:'a'}),
      placed('c','kitchen_cups',{x:315,y:316,supportUid:'b'}),placed('alone','sofa'));
    r.dog={x:320,y:300,supportUid:'b'};
    const s=saveWith(r), before=structuredClone(s);
    const moved=moveWithSupports(s,'a',340,420);
    expect(moved.studio.items.map(p=>[p.x,p.y])).toEqual([[340,420],[350,350],[355,336],[300,400]]);
    expect(moved.studio.dog).toEqual({x:360,y:320,supportUid:'b'});
    expect(s).toEqual(before);
    expect(moved.world).toBe(s.world);
    expect(moved.studio.items[3]).toBe(s.studio.items[3]);
    expect(moveWithSupports(s,'__dog__',12,34).studio.dog).toEqual({x:12,y:34,supportUid:'b'});
  });
  it('detaches direct children and dog in place, preserving deeper attachments', () => {
    const r=room(placed('a','kitchen_table'),placed('b','shelf',{supportUid:'a'}),
      placed('c','kitchen_cups',{supportUid:'b'}));
    r.dog={x:320,y:374,supportUid:'a'};
    const s=saveWith(r), next=detachSupports(s,'a');
    expect(next.studio.items[1]).toEqual(placed('b','shelf'));
    expect(next.studio.items[2].supportUid).toBe('b');
    expect(next.studio.dog).toEqual({x:320,y:374});
    expect(s.studio.items[1].supportUid).toBe('a');
  });
  it('returns the same save for invalid UID, nonfinite coordinates, no-op, or cycles', () => {
    const s=saveWith(room(placed('a','kitchen_table')));
    expect(moveWithSupports(s,'missing',1,2)).toBe(s);
    expect(detachSupports(s,'missing')).toBe(s);
    expect(moveWithSupports(s,'a',NaN,2)).toBe(s);
    expect(moveWithSupports(s,'a',300,400)).toBe(s);
    expect(detachSupports(s,'a')).toBe(s);
    const cyclic=saveWith(room(placed('a','shelf',{supportUid:'b'}),placed('b','shelf',{supportUid:'a'})));
    expect(moveWithSupports(cyclic,'a',20,30)).toBe(cyclic);
    expect(detachSupports(cyclic,'a')).toBe(cyclic);
    expect(isValidSupport(cyclic.studio,'a','b')).toBe(false);
  });
});
