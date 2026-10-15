import type { PlacedItem, RoomId, SaveData } from './types';
import { addPhoto } from './game';

export const BIRTHDAY_THEMES = ['#f6a8cc', '#b9a3ed', '#8ed8c5'] as const;
export type BirthdayStage = 'invite'|'kitchen'|'outfit'|'learn'|'party'|'done';
export interface BirthdayData {
  stage: BirthdayStage; active: boolean; theme: string;
  baselineLearn: number; baselineClaims: string[];
  photoId: string|null; completedAt: number|null;
}
export function defaultBirthday(): BirthdayData {
  return {stage:'invite',active:false,theme:BIRTHDAY_THEMES[0],baselineLearn:0,baselineClaims:[],photoId:null,completedAt:null};
}
export function sanitizeBirthday(raw: unknown): BirthdayData {
  const d=defaultBirthday();
  if(!raw || typeof raw!=='object') return d;
  const r=raw as Record<string,unknown>;
  const stage=(['invite','kitchen','outfit','learn','party','done'] as const).find(s=>s===r.stage)??d.stage;
  return {stage,active:r.active===true&&stage!=='done',theme:BIRTHDAY_THEMES.find(c=>c===r.theme)??d.theme,
    baselineLearn:typeof r.baselineLearn==='number'&&Number.isSafeInteger(r.baselineLearn)&&r.baselineLearn>=0?r.baselineLearn:0,
    baselineClaims:Array.isArray(r.baselineClaims)?[...new Set(r.baselineClaims.filter((c):c is string=>typeof c==='string'&&c.startsWith('learn:')))]:[],
    photoId:typeof r.photoId==='string'?r.photoId:null,
    completedAt:typeof r.completedAt==='number'&&Number.isFinite(r.completedAt)&&r.completedAt>=0?r.completedAt:null};
}
export function birthdayVisit(data: BirthdayData, room: RoomId): boolean {
  return data.active && ((data.stage==='kitchen'&&room==='kitchen')||(data.stage==='outfit'&&room==='dressing')||(data.stage==='party'&&room==='garden'));
}
const learnCount=(s:SaveData)=>Object.values(s.learning.daily).reduce((n,d)=>n+d.learnSessions,0);
/** Call after the existing checked learning completion. Round claims never qualify. */
export function syncBirthday(s:SaveData):SaveData {
  const b=s.birthday;
  if(!b||b.stage!=='learn'||learnCount(s)<=b.baselineLearn||!s.rewards.claimed.some(c=>c.startsWith('learn:')&&!b.baselineClaims.includes(c)))return s;
  return {...s,birthday:{...b,stage:'party'}};
}
function restoreRoom(s:SaveData):SaveData {
  return !s.world.unlocked.includes(s.world.activeRoom)&&!birthdayVisit(s.birthday,s.world.activeRoom)
    ? {...s,world:{...s.world,activeRoom:'studio'}}:s;
}
export function startBirthday(s:SaveData):SaveData {
  if(s.birthday.active||s.birthday.stage==='done')return s;
  return {...s,birthday:{...s.birthday,active:true}};
}
export function restartBirthday(s:SaveData):SaveData {
  return s.birthday.stage==='done'?{...s,birthday:{...defaultBirthday(),active:true}}:s;
}
export function pauseBirthday(s:SaveData):SaveData {return restoreRoom({...s,birthday:{...s.birthday,active:false}});}
export function birthdayTheme(s:SaveData,theme:string):SaveData {
  if(!s.birthday.active||!BIRTHDAY_THEMES.some(c=>c===theme))return s;
  return {...s,birthday:{...s.birthday,theme},world:{...s.world,rooms:{...s.world.rooms,kitchen:{...s.world.rooms.kitchen,items:s.world.rooms.kitchen.items.map(p=>p.itemId==='kitchen_table'?{...p,color:theme}:p)}}}};
}
/** Adds only missing free props; existing positions, scale and UIDs survive. */
export function prepareBirthdayKitchen(s:SaveData):SaveData {
  if(!s.birthday.active||s.birthday.stage!=='kitchen')return s;
  const room=s.world.rooms.kitchen;
  const ids=['kitchen_table','kitchen_plates','kitchen_cups'];
  const items:PlacedItem[]=[...room.items];
  const uid=(id:string)=>{const base=`birthday-${id}`;let value=base,n=1;while(items.some(p=>p.uid===value))value=`${base}-${n++}`;return value;};
  let table=items.find(p=>p.itemId==='kitchen_table');
  if(!table){table={itemId:'kitchen_table',uid:uid('kitchen_table'),x:620,y:435,scale:1,flip:false};items.push(table);}
  // The table SVG's usable surface is 70 units above its bottom-centre.
  // Existing props retain their positions and attachment choices.
  for(const [itemId,offset] of [['kitchen_plates',-50],['kitchen_cups',40]] as const){
    if(items.some(p=>p.itemId===itemId))continue;
    items.push({itemId,uid:uid(itemId),x:table.x+offset*table.scale*(table.flip?-1:1),y:table.y-70*table.scale,
      scale:Math.min(1,table.scale),flip:false,supportUid:table.uid});
  }
  return {...s,owned:{...s.owned,furniture:[...new Set([...s.owned.furniture,...ids])]},world:{...s.world,rooms:{...s.world.rooms,kitchen:{...room,items:items.map(p=>p.itemId==='kitchen_table'?{...p,color:s.birthday.theme}:p)}}}};
}
export function advanceBirthday(s:SaveData):SaveData {
  const b=s.birthday;if(!b.active)return s;
  if(b.stage==='invite')return {...s,birthday:{...b,stage:'kitchen'},metDogs:[...new Set([...s.metDogs,'lola'])]};
  if(b.stage==='kitchen') {
    if(!['kitchen_table','kitchen_plates','kitchen_cups'].every(id=>s.world.rooms.kitchen.items.some(p=>p.itemId===id)))return s;
    return restoreRoom({...s,birthday:{...b,stage:'outfit'}});
  }
  if(b.stage==='outfit')return restoreRoom({...s,birthday:{...b,stage:'learn',baselineLearn:learnCount(s),baselineClaims:s.rewards.claimed.filter(c=>c.startsWith('learn:'))}});
  return s;
}
export function finishBirthday(s:SaveData,now:number):SaveData {
  const b=s.birthday;
  if(!b.active||b.stage!=='party'||b.photoId||s.world.activeRoom!=='garden')return s;
  const result=addPhoto(s,{dogId:'lola',outfit:structuredClone(s.outfits.lola??{}),backdrop:'party',title:`יום ההולדת של לולה · ${new Date(now).toLocaleDateString('he-IL')}`,request:null,directionId:null,stars:3},now,false);
  return restoreRoom({...result.save,birthday:{...b,stage:'done',active:false,photoId:result.entry.id,completedAt:now}});
}
