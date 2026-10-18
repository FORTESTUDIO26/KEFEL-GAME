import { expect, it } from 'vitest';
import { defaultSave, validateSave } from './save';
import { answerOpening, challengeReady, closeOpening, editRoom, exposeOpening, getRoom, OLD_REVIEW_IN_CHALLENGE, roomReadiness, startOpening, switchRoom } from './world';
import { parseKey } from '../learning/facts';
import { recordAnswer, moveDog } from './game';
import { exportText,parseImport } from './save';
const now = new Date(2026,9,14,12).getTime();
const day=(n:number)=>now-n*86400_000;
const T3=['3x3','3x4','3x5','3x6','3x7','3x8','3x9','3x10'];
const T4=['3x4','4x4','4x5','4x6','4x7','4x8','4x9','4x10'];
/** Memorised = remembered alone on two different earlier days. */
function memorise(s:ReturnType<typeof defaultSave>,keys:string[]) {
 for(const k of keys){const [a,b]=parseKey(k);s=recordAnswer(s,{a,b,outcome:'independent',usedHint:false},day(4));s=recordAnswer(s,{a,b,outcome:'independent',usedHint:false},day(2));}
 return s;
}
const ready=()=>memorise(defaultSave(now),T3);
function answerAll(s:ReturnType<typeof defaultSave>, wrongAt=-1, helpAt=-1) {
 const n=s.world.opening!.facts.length;
 for(let i=0;i<n;i++){
  if(i===helpAt){s=answerOpening(exposeOpening(s),now,true);continue;}
  if(i===wrongAt){const [a,b]=parseKey(s.world.opening!.facts[i]);s=exposeOpening(recordAnswer(s,{a,b,outcome:'wrong',usedHint:false},now));s=answerOpening(s,now,true);continue;}
  s=answerOpening(s,now,false);
 }
 return s;
}
it('the ×3 challenge is ready only when all of ×3 is memorised; rooms say which table opens them',()=>{
 const partial=memorise(defaultSave(now),T3.slice(0,7));
 expect(challengeReady(partial)).toBe(false);
 expect(startOpening(partial).world.opening).toBeNull();
 expect(roomReadiness(partial,'dressing')).toMatchObject({ready:false,table:3});
 expect(roomReadiness(partial,'kitchen')).toMatchObject({ready:false,table:4});
 expect(challengeReady(ready())).toBe(true);
 expect(roomReadiness(ready(),'dressing').ready).toBe(true);
 expect(roomReadiness(ready(),'kitchen').ready).toBe(false);
 expect(switchRoom(defaultSave(now),'garden').world.activeRoom).toBe('studio');
});
it('the ×3 challenge asks every ×3 fact once (no reversed duplicates)',()=>{
 const s=startOpening(ready(),()=>0.5);
 const o=s.world.opening!;
 expect(o.table).toBe(3);expect(o.roomId).toBe('dressing');
 expect([...o.facts].sort()).toEqual([...T3].sort());
});
it('7 of 8 does not open the room; the result offers focused practice and a new try',()=>{
 let s=answerAll(startOpening(ready()),4);
 expect(s.world.unlocked).not.toContain('dressing');
 expect(s.world.opening).toMatchObject({finished:true,score:7});
 const coins=s.coins;
 s=closeOpening(s,true);
 expect(s.learning.learnFocus).toHaveLength(1);
 expect(s.learning.tablesDone).toEqual([]);
 expect(s.coins).toBe(coins);
});
it('help is allowed but not counted',()=>{
 const s=answerAll(startOpening(ready()),-1,0);
 expect(s.world.opening).toMatchObject({finished:true,score:7});
 expect(s.world.unlocked).not.toContain('dressing');
});
it('all correct alone: ×3 is done and opens the dressing room; ×4 is next and opens the kitchen',()=>{
 let s=answerAll(startOpening(ready()));
 expect(s.world.unlocked).toContain('dressing');
 expect(s.world.opening).toBeNull();
 expect(s.world.activeRoom).toBe('dressing');
 expect(s.learning.tablesDone).toEqual([3]);
 expect(roomReadiness(s,'kitchen')).toMatchObject({table:4,ready:false});
 const reloaded=validateSave(JSON.parse(JSON.stringify(s)),now);
 expect(reloaded.ok&&reloaded.data.learning.tablesDone).toEqual([3]);
});
it('opening a new room also reviews the old tables',()=>{
 let s=answerAll(startOpening(ready()));
 s=memorise(s,T4);
 expect(challengeReady(s)).toBe(true);
 s=startOpening(s,()=>0.3);
 const o=s.world.opening!;
 expect(o.table).toBe(4);expect(o.roomId).toBe('kitchen');
 const own=o.facts.filter(k=>parseKey(k).includes(4));
 const old=o.facts.filter(k=>!parseKey(k).includes(4));
 // every ×4 fact (3×4 may be resting: 5 times remembered alone already proved it)
 for(const k of T4.filter(k=>k!=='3x4')) expect(own).toContain(k);
 expect(old.length).toBeGreaterThan(0);
 expect(old.length).toBeLessThanOrEqual(OLD_REVIEW_IN_CHALLENGE);
 for(const k of old) expect(parseKey(k)).toContain(3);
 expect(new Set(o.facts).size).toBe(o.facts.length);
 // a failed later challenge never closes a room again
 s=answerAll(s,0);
 expect(s.world.unlocked).toContain('dressing');
});
it('a challenge stopped in the middle continues after reload',()=>{
 let s=startOpening(ready());
 s=answerOpening(s,now,false);s=exposeOpening(s);
 const loaded=validateSave(JSON.parse(JSON.stringify(s)),now);
 expect(loaded.ok).toBe(true);if(!loaded.ok)return;
 expect(loaded.data.world.opening).toMatchObject({index:1,score:1,helped:true,table:3});
});
it('keeps separate layouts and ignores edits to locked rooms',()=>{
 let s=ready();s.world.unlocked.push('dressing');
 s=editRoom(s,'dressing',x=>moveDog(x,600,450));
 expect(getRoom(s,'dressing').dog.x).toBe(600);
 expect(s.studio.dog.x).toBe(420);
 expect(editRoom(s,'garden',x=>moveDog(x,500,450))).toBe(s);
});
it('migrates old ownership without giving new players old freebies',()=>{
 const raw={...defaultSave(now),version:2};
 const loaded=validateSave(raw,now);
 expect(loaded.ok&&loaded.data.owned.wearables.includes('flower_clip')).toBe(true);
 expect(defaultSave(now).owned.wearables).not.toContain('flower_clip');
});
it('imports room layouts and activities, repairs malformed room data safely',()=>{
 let s=ready();s.world.unlocked.push('garden');s.world.activeRoom='garden';
 s.world.rooms.garden.items=[{uid:'garden-rug',itemId:'rug_round',x:210,y:460,scale:1,flip:false}];
 s.world.activities.garden=3;
 const v=parseImport(exportText(s,now),now);
 expect(v.ok).toBe(true);if(!v.ok)return;
 expect(v.data.world.rooms.garden.items[0].x).toBe(210);
 expect(v.data.world.activeRoom).toBe('garden');
 expect(v.data.world.activities.garden).toBe(3);
 const raw=JSON.parse(JSON.stringify(s));raw.world.activeRoom='not-room';raw.world.opening={roomId:'stage',facts:['9x9','9x9'],index:99};raw.world.rooms.garden.dog={x:-999,y:Infinity};
 const repaired=validateSave(raw,now);expect(repaired.ok).toBe(true);if(!repaired.ok)return;
 expect(repaired.data.world.activeRoom).toBe('studio');
 expect(repaired.data.world.opening).toBeNull();
 expect(repaired.data.coins).toBe(s.coins);
});
it('additional rooms and side-wing placements survive an older save import',()=>{
 let s=ready();s.version=4;s.world.unlocked.push('cafe','craft');s.world.activeRoom='cafe';
 s=editRoom(s,'cafe',x=>moveDog(x,-250,450));
 s.world.rooms.craft.items=[{uid:'far-rug',itemId:'rug_round',x:1100,y:440,scale:1,flip:false}];
 const v=parseImport(exportText(s,now),now);expect(v.ok).toBe(true);if(!v.ok)return;
 expect(v.data.world.rooms.cafe.dog.x).toBe(-250);expect(v.data.world.rooms.craft.items[0].x).toBe(1100);expect(v.data.studio.dog.x).toBe(420);
 expect(v.data.world.activeRoom).toBe('cafe');expect(v.data.coins).toBe(s.coins);
});
it('new household rooms preserve layout, rewards, and existing rooms through schema upgrade',()=>{
 let s=ready();s.version=5;s.coins=145;s.world.unlocked.push('kitchen','bathroom');s.world.activeRoom='bathroom';
 s=editRoom(s,'bathroom',d=>({...d,studio:{...d.studio,items:[{uid:'soap',itemId:'bath_soap',x:-100,y:410,scale:1,flip:false}]}}));
 const r=parseImport(exportText(s,now),now);expect(r.ok).toBe(true);if(!r.ok)return;
 expect(r.data.coins).toBe(145);expect(r.data.world.rooms.bathroom.items[0].itemId).toBe('bath_soap');expect(r.data.studio.dog.x).toBe(420);expect(r.data.world.activeRoom).toBe('bathroom');
});
