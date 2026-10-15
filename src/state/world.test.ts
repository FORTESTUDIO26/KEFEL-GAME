import { expect, it } from 'vitest';
import { defaultSave, validateSave } from './save';
import { answerOpening, closeOpening, editRoom, exposeOpening, getRoom, roomReadiness, startOpening, switchRoom } from './world';
import { parseKey } from '../learning/facts';
import { recordAnswer, moveDog } from './game';
import { exportText,parseImport } from './save';
const now = new Date(2026,9,14,12).getTime();
const TEN=[[2,3],[2,4],[5,6],[7,8],[3,4],[3,6],[4,6],[6,7],[6,9],[8,9],[4,7]];
const day=(n:number)=>now-n*86400_000;
/** Learned = remembered alone once (on an earlier day, so it counts as remembering alone). */
function ready(n=10) {
 let s=defaultSave(now);
 for(const [a,b] of TEN.slice(0,n)) s=recordAnswer(s,{a,b,outcome:'independent',usedHint:false},day(2));
 return s;
}
function answerAll(s:ReturnType<typeof defaultSave>, wrongAt=-1, helpAt=-1) {
 for(let i=0;i<10;i++){
  if(i===helpAt){s=answerOpening(exposeOpening(s),now,true);continue;}
  if(i===wrongAt){const [a,b]=parseKey(s.world.opening!.facts[i]);s=exposeOpening(recordAnswer(s,{a,b,outcome:'wrong',usedHint:false},now));s=answerOpening(s,now,true);continue;}
  s=answerOpening(s,now,false);
 }
 return s;
}
it('a room challenge needs 10 learned facts, and says how many are missing',()=>{
 expect(roomReadiness(ready(9),'dressing')).toMatchObject({ready:false,learned:9,needed:10});
 expect(startOpening(ready(9),'dressing').world.opening).toBeNull();
 expect(roomReadiness(ready(10),'garden').ready).toBe(true);
 expect(switchRoom(defaultSave(now),'garden').world.activeRoom).toBe('studio');
 // never a fact that was only seen with help
 let s=defaultSave(now);for(const [a,b] of TEN) s=recordAnswer(s,{a,b,outcome:'supported',usedHint:false},day(1));
 expect(roomReadiness(s,'dressing').learned).toBe(0);
});
it('asks 10 different facts (no reversed duplicates), all already learned',()=>{
 const s=startOpening(ready(11),'dressing',()=>0.5);
 const facts=s.world.opening!.facts;
 expect(facts).toHaveLength(10);
 expect(new Set(facts).size).toBe(10);
 for(const k of facts) expect(s.learning.facts[k].independentCorrect).toBeGreaterThan(0);
});
it('9/10 does not open the room; the result offers focused practice and a new try',()=>{
 let s=answerAll(startOpening(ready(),'dressing'),4);
 expect(s.world.unlocked).not.toContain('dressing');
 expect(s.world.opening).toMatchObject({finished:true,score:9});
 expect(s.world.opening!.missed).toHaveLength(1);
 const coins=s.coins;
 s=closeOpening(s,true);
 expect(s.learning.learnFocus).toHaveLength(1);
 expect(s.coins).toBe(coins);
});
it('help is allowed but not counted',()=>{
 const s=answerAll(startOpening(ready(),'dressing'),-1,0);
 expect(s.world.opening).toMatchObject({finished:true,score:9});
 expect(s.world.unlocked).not.toContain('dressing');
});
it('10/10 remembered alone opens the room; an open room stays open',()=>{
 let s=answerAll(startOpening(ready(),'dressing'));
 expect(s.world.unlocked).toContain('dressing');
 expect(s.world.opening).toBeNull();
 expect(s.world.activeRoom).toBe('dressing');
 // a later failed challenge for another room never locks it again
 s=answerAll(startOpening(s,'garden'),0);
 expect(s.world.unlocked).toContain('dressing');
 const reloaded=validateSave(JSON.parse(JSON.stringify(s)),now);
 expect(reloaded.ok&&reloaded.data.world.unlocked).toContain('dressing');
});
it('a challenge stopped in the middle continues after reload',()=>{
 let s=startOpening(ready(),'dressing');
 s=answerOpening(s,now,false);s=exposeOpening(s);
 const loaded=validateSave(JSON.parse(JSON.stringify(s)),now);
 expect(loaded.ok).toBe(true);if(!loaded.ok)return;
 expect(loaded.data.world.opening).toMatchObject({index:1,score:1,helped:true});
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
