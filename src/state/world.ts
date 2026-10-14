import type { RoomId,RoomLayout,SaveData,WorldData } from './types';
import { isValidKey,parseKey } from '../learning/facts';
import { recordAnswer } from './game';
export const ROOMS: {id:RoomId;name:string;sessions:number;days:number}[]=[
 {id:'studio',name:'סטודיו לעיצוב',sessions:0,days:0},
 {id:'dressing',name:'חדר הלבשה',sessions:3,days:2},
 {id:'garden',name:'גינת הכלבים',sessions:6,days:3},
 {id:'stage',name:'במת הסרטים',sessions:9,days:4},
 {id:'cafe',name:'קפה כלבלב',sessions:12,days:5},
 {id:'craft',name:'חדר יצירה',sessions:15,days:6},
];
const layout=():RoomLayout=>({wall:'wall_stripes',floor:'floor_wood',items:[],dog:{x:420,y:465}});
export function defaultWorld():WorldData {return {activeRoom:'studio',unlocked:['studio'],rooms:{dressing:layout(),garden:layout(),stage:layout(),cafe:layout(),craft:layout()},opening:null,activities:{garden:0,stage:0,cafe:0,craft:0}};}
export function getRoom(s:SaveData,id:RoomId):RoomLayout{return id==='studio'?s.studio:s.world.rooms[id];}
export function editRoom(s:SaveData,id:RoomId,fn:(s:SaveData)=>SaveData):SaveData {
 if(!s.world.unlocked.includes(id))return s;
 const next=fn({...s,studio:getRoom(s,id)});
 return id==='studio'?next:{...next,studio:s.studio,world:{...next.world,rooms:{...next.world.rooms,[id]:next.studio}}};
}
export function switchRoom(s:SaveData,id:RoomId):SaveData{return s.world.unlocked.includes(id)?{...s,world:{...s.world,activeRoom:id}}:s;}
export function roomReadiness(s:SaveData,id:RoomId) {
 const room=ROOMS.find(r=>r.id===id)!;
 const logs=Object.values(s.learning.daily);
 const sessions=Math.max(s.progress.roundsCompleted,logs.reduce((n,d)=>n+d.rounds,0))+Math.max(s.learning.learnLog.length,logs.reduce((n,d)=>n+d.learnSessions,0));
 const days=new Set([...s.progress.practiceDays,...Object.entries(s.learning.daily).filter(([,d])=>d.rounds+d.learnSessions>0).map(([day])=>day)]).size;
 const taught=Object.entries(s.learning.facts).filter(([key,f])=>isValidKey(key)&&f.attempts>0).length;
 return {sessions,days,taught,ready:id==='studio'||sessions>=room.sessions&&days>=room.days&&taught>=4};
}
export function startOpening(s:SaveData,id:RoomId):SaveData {
 if(id==='studio'||s.world.unlocked.includes(id)||!roomReadiness(s,id).ready||s.world.opening)return s;
 const facts=Object.entries(s.learning.facts).filter(([key,f])=>isValidKey(key)&&f.attempts>0).sort((a,b)=>b[1].independentCorrect-a[1].independentCorrect||a[0].localeCompare(b[0])).slice(0,4).map(([key])=>key);
 return {...s,world:{...s.world,opening:{roomId:id,facts,index:0,helped:false}}};
}
export function exposeOpening(s:SaveData):SaveData {return s.world.opening?{...s,world:{...s.world,opening:{...s.world.opening,helped:true}}}:s;}
export function answerOpening(s:SaveData,now:number,helped:boolean):SaveData {
 const o=s.world.opening;if(!o||!o.facts[o.index])return s;
 const [a,b]=parseKey(o.facts[o.index]);const usedHint=helped||o.helped;
 const next=recordAnswer(s,{a,b,outcome:usedHint?'supported':'independent',usedHint},now);
 const index=o.index+1;
 return {...next,world:{...next.world,opening:index<o.facts.length?{...o,index,helped:false}:null,unlocked:index===o.facts.length?[...new Set([...s.world.unlocked,o.roomId])]:s.world.unlocked,activeRoom:index===o.facts.length?o.roomId:s.world.activeRoom}};
}
export function roomActivity(s:SaveData,id:RoomId):SaveData {return id==='garden'||id==='stage'||id==='cafe'||id==='craft'?{...s,world:{...s.world,activities:{...s.world.activities,[id]:Math.min(100000,s.world.activities[id]+1)}}}:s;}
