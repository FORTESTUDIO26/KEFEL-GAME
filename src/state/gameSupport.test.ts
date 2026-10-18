import { describe, expect, it } from 'vitest';
import { buildLearnSession } from '../learning/learnPath';
import { factKey } from '../learning/facts';
import { completeLearnSession, moveDog, removePlaced, updatePlaced } from './game';
import { defaultSave } from './save';
import type { PlacedItem } from './types';

const item=(uid:string,itemId:string,extra:Partial<PlacedItem>={}):PlacedItem =>
  ({uid,itemId,x:300,y:400,scale:1,flip:false,...extra});
function fixture() {
  const s=defaultSave(1000);
  s.owned.furniture=[...new Set([...s.owned.furniture,'kitchen_table','kitchen_cups','kitchen_plates','dog_bed'])];
  s.studio={...s.studio,items:[item('table','kitchen_table'),
    item('cup','kitchen_cups',{x:310,y:330,supportUid:'table'}),
    item('plate','kitchen_plates',{x:315,y:310,supportUid:'cup'}),
    item('bed','dog_bed',{x:600,y:420})],dog:{x:600,y:394,supportUid:'bed'}};
  return s;
}

describe('support-aware game actions',()=>{
  it('moves descendants by the bounded host delta without mutating the input',()=>{
    const s=fixture(), before=structuredClone(s);
    const next=updatePlaced(s,'table',{x:340,y:430});
    expect(next.studio.items[1]).toMatchObject({x:350,y:360,supportUid:'table'});
    expect(next.studio.items[2]).toMatchObject({x:355,y:340,supportUid:'cup'});
    expect(next.studio.dog).toBe(s.studio.dog);
    expect(s).toEqual(before);
    expect(updatePlaced(s,'bed',{x:640,y:450}).studio.dog).toEqual({x:640,y:424,supportUid:'bed'});
  });
  it('detaches a dragged child but keeps attachments for color-only updates',()=>{
    const s=fixture();
    const next=updatePlaced(s,'cup',{x:350});
    expect(next.studio.items[1].supportUid).toBeUndefined();
    expect(next.studio.items[2]).toMatchObject({x:355,y:310,supportUid:'cup'});
    expect(updatePlaced(s,'cup',{color:'#abcdef'}).studio.items[1].supportUid).toBe('table');
  });
  it('accepts a compatible owned host and rejects missing, self, cyclic and unowned hosts',()=>{
    const s=fixture();
    expect(updatePlaced(s,'cup',{x:320,y:330,supportUid:'table'}).studio.items[1].supportUid).toBe('table');
    for(const supportUid of ['absent','cup','plate','bed']) {
      expect(updatePlaced(s,'cup',{supportUid}).studio.items[1].supportUid).toBeUndefined();
    }
    const unowned={...s,owned:{...s.owned,furniture:s.owned.furniture.filter(id=>id!=='kitchen_table')}};
    expect(updatePlaced(unowned,'cup',{supportUid:'table'}).studio.items[1].supportUid).toBeUndefined();
    expect(updatePlaced(s,'cup',{supportUid:undefined}).studio.items[1].supportUid).toBeUndefined();
  });
  it.each([{scale:1.6},{flip:true}])('safely drops descendants when host geometry changes: %j',patch=>{
    const s=fixture(), next=updatePlaced(s,'table',patch);
    expect(next.studio.items[1]).toMatchObject({x:310,y:420});
    expect(next.studio.items[2]).toMatchObject({x:315,y:420});
    expect(next.studio.items[1].supportUid).toBeUndefined();
    expect(next.studio.items[2].supportUid).toBeUndefined();
    const dog=updatePlaced(s,'bed',patch).studio.dog;
    expect(dog).toEqual({x:600,y:465});
  });
  it('drops removed-host descendants to the floor and leaves other rooms intact',()=>{
    const s=fixture(), next=removePlaced(s,'table');
    expect(next.studio.items.some(p=>p.uid==='table')).toBe(false);
    expect(next.studio.items.find(p=>p.uid==='cup')).toMatchObject({x:310,y:420});
    expect(next.studio.items.find(p=>p.uid==='plate')?.supportUid).toBeUndefined();
    expect(next.world).toBe(s.world);
    expect(removePlaced(s,'bed').studio.dog).toEqual({x:600,y:465});
  });
  it('preserves bounds and detaches carried objects that would leave them',()=>{
    const s=fixture();
    const next=updatePlaced(s,'table',{x:9999,y:9999,scale:99});
    expect(next.studio.items[0]).toMatchObject({x:1580,y:500,scale:1.6});
    for(const p of next.studio.items) {
      expect(p.x).toBeGreaterThanOrEqual(-780);expect(p.x).toBeLessThanOrEqual(1580);
      expect(p.y).toBeGreaterThanOrEqual(40);expect(p.y).toBeLessThanOrEqual(500);
    }
    const carried=updatePlaced(s,'table',{x:1580});
    expect(carried.studio.items[1]).toMatchObject({x:1580,y:420});
    expect(carried.studio.items[1].supportUid).toBeUndefined();
    const bounded=updatePlaced(s,'table',{x:-9999});
    expect(bounded.studio.items[0].x).toBe(-780);
    expect(bounded.studio.items[1]).toMatchObject({x:-770,y:330,supportUid:'table'});
    expect(updatePlaced(s,'bed',{x:1580}).studio.dog).toEqual({x:1560,y:465});
  });
  it('keeps children for unchanged geometry and detaches a resized child from its host',()=>{
    const s=fixture();
    expect(updatePlaced(s,'table',{scale:1,flip:false}).studio.items[1]).toBe(s.studio.items[1]);
    const next=updatePlaced(s,'cup',{scale:.5});
    expect(next.studio.items[1].supportUid).toBeUndefined();
    expect(next.studio.items[2]).toMatchObject({x:315,y:420});
    expect(next.studio.items[2].supportUid).toBeUndefined();
  });
  it('moveDog detaches and retains existing dog bounds',()=>{
    const s=fixture();
    expect(moveDog(s,9999,-9999).studio.dog).toEqual({x:1560,y:340});
    expect(moveDog(s,600,394).studio.dog.supportUid).toBeUndefined();
    expect(moveDog(s,NaN,400)).toBe(s);
  });
  it('leaves invalid UIDs, cyclic saves and nonfinite patches unchanged',()=>{
    const s=fixture();
    expect(updatePlaced(s,'absent',{x:1})).toBe(s);
    expect(removePlaced(s,'absent')).toBe(s);
    for(const patch of [{x:NaN},{y:Infinity},{scale:NaN}]) expect(updatePlaced(s,'table',patch)).toBe(s);
    s.studio.items[0].supportUid='cup';
    expect(updatePlaced(s,'table',{x:100})).toBe(s);
    expect(removePlaced(s,'table')).toBe(s);
  });
  it('advances the birthday directly after a newly rewarded learning completion',()=>{
    const s=fixture();
    s.birthday={...s.birthday,active:true,stage:'learn',baselineLearn:0,baselineClaims:[]};
    const session=buildLearnSession(s.learning,[2,3,4,5,6,7].map(n=>factKey(2,n)),2000,()=>.5);
    const result=completeLearnSession(s,{...session,index:session.steps.length-1,helped:6,alone:0,afterHelp:6},3000);
    expect(result.save.birthday.stage).toBe('party');
    expect(result.coins).toBe(50);
    const replay=completeLearnSession(result.save,session,4000);
    expect(replay.save).toBe(result.save);expect(replay.coins).toBe(0);
  });
});
