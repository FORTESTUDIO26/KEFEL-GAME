import { expect, it } from 'vitest';
import { defaultSave, validateSave } from './save';
import { answerOpening, editRoom, exposeOpening, getRoom, roomReadiness, startOpening, switchRoom } from './world';
import { recordAnswer, moveDog } from './game';
import { exportText,parseImport } from './save';
const now = new Date(2026,9,14,12).getTime();
function ready() {
 let s=defaultSave(now);
 for(const [a,b] of [[2,3],[2,4],[5,6],[7,8]]) s=recordAnswer(s,{a,b,outcome:'supported',usedHint:true},now);
 s.progress.roundsCompleted=3;s.progress.practiceDays=['2026-10-13','2026-10-14'];return s;
}
it('gates rooms on completed participation across days and taught facts',()=>{
 expect(roomReadiness(defaultSave(now),'dressing').ready).toBe(false);
 expect(roomReadiness(ready(),'dressing').ready).toBe(true);
 expect(roomReadiness(ready(),'garden').ready).toBe(false);
 expect(switchRoom(defaultSave(now),'garden').world.activeRoom).toBe('studio');
});
it('keeps separate layouts and ignores edits to locked rooms',()=>{
 let s=ready();s.world.unlocked.push('dressing');
 s=editRoom(s,'dressing',x=>moveDog(x,600,450));
 expect(getRoom(s,'dressing').dog.x).toBe(600);
 expect(s.studio.dog.x).toBe(420);
 expect(editRoom(s,'garden',x=>moveDog(x,500,450))).toBe(s);
});
it('helped ceremony persists mid-way, never counts as independent and unlocks once',()=>{
 let s=startOpening(ready(),'dressing');
 expect(s.world.opening?.facts).toHaveLength(4);
 s=exposeOpening(s);
 const loaded=validateSave(JSON.parse(JSON.stringify(s)),now);
 expect(loaded.ok).toBe(true);if(!loaded.ok)return;
 expect(loaded.data.world.opening?.helped).toBe(true);
 s=answerOpening(loaded.data,now,false);
 expect(s.world.opening?.index).toBe(1);
 for(let i=0;i<3;i++)s=answerOpening(exposeOpening(s),now,false);
 expect(s.world.unlocked).toContain('dressing');
 expect(s.world.opening).toBeNull();
 expect(Object.values(s.learning.facts).reduce((n,f)=>n+f.independentCorrect,0)).toBe(0);
 expect(answerOpening(s,now,false)).toBe(s);
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
