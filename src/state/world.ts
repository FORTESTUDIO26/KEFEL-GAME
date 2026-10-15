import type { PlacedItem,RoomId,RoomLayout,SaveData,WorldData } from './types';
import { KITCHEN_STARTER } from '../content/kitchenLayout';
import { isValidKey,parseKey } from '../learning/facts';
import {birthdayVisit} from './birthday';
import { recordAnswer } from './game';
import { wouldCountAlone } from '../learning/data';
import { restRemaining } from '../learning/scheduler';
export const ROOMS: {id:RoomId;name:string;sessions:number;days:number}[]=[
 {id:'studio',name:'סטודיו לעיצוב',sessions:0,days:0},
 {id:'dressing',name:'חדר הלבשה',sessions:3,days:2},
 {id:'garden',name:'חצר הכלבים',sessions:6,days:3},
 {id:'stage',name:'במת הסרטים',sessions:9,days:4},
 {id:'cafe',name:'קפה כלבלב',sessions:12,days:5},
 {id:'craft',name:'חדר יצירה',sessions:15,days:6},
 {id:'kitchen',name:'המטבח המתוק',sessions:2,days:1},
 {id:'bathroom',name:'מקלחת ובועות',sessions:4,days:2},
];
const layout=():RoomLayout=>({wall:'wall_stripes',floor:'floor_wood',items:[],dog:{x:420,y:465}});
/** The ready-made kitchen (free pieces only): cabinets, worktop, sink, hob, oven, fridge, table and chairs. */
export function kitchenStarterItems():PlacedItem[]{return KITCHEN_STARTER.map((p,i)=>({uid:`kitchen-start-${i}`,itemId:p.itemId,x:p.x,y:p.y,scale:p.scale??1,flip:p.flip??false}));}
export function defaultWorld():WorldData {return {activeRoom:'studio',unlocked:['studio'],rooms:{dressing:layout(),garden:layout(),stage:layout(),cafe:layout(),craft:layout(),kitchen:{...layout(),items:kitchenStarterItems(),dog:{x:300,y:470}},bathroom:layout()},opening:null,activities:{garden:0,stage:0,cafe:0,craft:0,kitchen:0,bathroom:0}};}
export function getRoom(s:SaveData,id:RoomId):RoomLayout{return id==='studio'?s.studio:s.world.rooms[id];}
export function editRoom(s:SaveData,id:RoomId,fn:(s:SaveData)=>SaveData):SaveData {
 if(!s.world.unlocked.includes(id)&&!birthdayVisit(s.birthday,id))return s;
 const next=fn({...s,studio:getRoom(s,id)});
 return id==='studio'?next:{...next,studio:s.studio,world:{...next.world,rooms:{...next.world.rooms,[id]:next.studio}}};
}
export function switchRoom(s:SaveData,id:RoomId):SaveData{return s.world.unlocked.includes(id)||birthdayVisit(s.birthday,id)?{...s,world:{...s.world,activeRoom:id}}:s;}
export const CHALLENGE_SIZE=10;
/** Facts that may appear in a room challenge: remembered alone at least once, and not resting. */
export function challengeFacts(s:SaveData):string[] {
 return Object.entries(s.learning.facts).filter(([key,f])=>isValidKey(key)&&f.independentCorrect>0&&restRemaining(f,s.learning.questionCount)===0).map(([key])=>key).sort();
}
/** How close the room is: learned facts available for its challenge. */
export function roomReadiness(s:SaveData,id:RoomId) {
 const learned=challengeFacts(s).length;
 return {learned,needed:CHALLENGE_SIZE,ready:id==='studio'||learned>=CHALLENGE_SIZE};
}
export function startOpening(s:SaveData,id:RoomId,rng:()=>number=Math.random):SaveData {
 if(id==='studio'||s.world.unlocked.includes(id)||!roomReadiness(s,id).ready||(s.world.opening&&!s.world.opening.finished))return s;
 const pool=challengeFacts(s);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 // most recently helped facts last, so they are furthest from any answer seen before
 const facts=pool.slice(0,CHALLENGE_SIZE).sort((x,y)=>(s.learning.facts[x].helpQ??-1)-(s.learning.facts[y].helpQ??-1));
 return {...s,world:{...s.world,opening:{roomId:id,facts,index:0,helped:false,score:0,missed:[],finished:false}}};
}
export function exposeOpening(s:SaveData):SaveData {return s.world.opening&&!s.world.opening.finished?{...s,world:{...s.world,opening:{...s.world.opening,helped:true}}}:s;}
/**
 * Move past the current question. Without help: a correct answer, scored only if it counts as
 * remembering alone. With help: the explanation was seen — not scored, no penalty.
 */
export function answerOpening(s:SaveData,now:number,helped:boolean):SaveData {
 const o=s.world.opening;if(!o||o.finished||!o.facts[o.index])return s;
 const key=o.facts[o.index];const [a,b]=parseKey(key);const usedHelp=helped||o.helped;
 let next=s;let alone=false;
 if(usedHelp) next=recordAnswer(s,{a,b,outcome:'supported',usedHint:false,exposureOnly:true},now);
 else {alone=wouldCountAlone(s.learning,key,now);next=recordAnswer(s,{a,b,outcome:'independent',usedHint:false},now);}
 const index=o.index+1;const score=o.score+(alone?1:0);const missed=alone?o.missed:[...o.missed,key];
 if(index<o.facts.length) return {...next,world:{...next.world,opening:{...o,index,helped:false,score,missed}}};
 if(score===o.facts.length) return {...next,world:{...next.world,opening:null,unlocked:[...new Set([...next.world.unlocked,o.roomId])],activeRoom:o.roomId}};
 return {...next,world:{...next.world,opening:{...o,index,helped:false,score,missed,finished:true}}};
}
/** Close the challenge; optionally point the next learning session at the facts that needed help. */
export function closeOpening(s:SaveData,focus:boolean):SaveData {
 const o=s.world.opening;if(!o)return s;
 const learning=focus?{...s.learning,learnFocus:[...new Set([...o.missed,...s.learning.learnFocus])].slice(0,10)}:s.learning;
 return {...s,learning,world:{...s.world,opening:null}};
}
export function roomActivity(s:SaveData,id:RoomId):SaveData {return id==='garden'||id==='stage'||id==='cafe'||id==='craft'||id==='kitchen'||id==='bathroom'?{...s,world:{...s.world,activities:{...s.world.activities,[id]:Math.min(100000,s.world.activities[id]+1)}}}:s;}
