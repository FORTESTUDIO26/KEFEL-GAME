// Pure game actions used by the UI. Each takes a SaveData and returns a new one.

import { furnitureById, REQUESTS, wearableById, type BackdropId, type ClientRequest } from '../content/catalog';
import { grantPlay } from './playTime';
import { DOGS } from '../content/dogs';
import { applyOutcome, applyRecognition, finishRoundLog, type AnswerRecord } from '../learning/data';
import type { FactKey } from '../learning/facts';
import type { Outcome } from '../learning/scheduler';
import type { Round } from '../learning/session';
import { buildLearnSession, chooseLearnSet, finishLearnLog, learnReward, type LearnSession } from '../learning/learnPath';
import { addCoins, registerPracticeDay, roundReward, STYLE_COIN_PER_STAR, type RoundReward } from './economy';
import { claimMission } from './missionRewards';
import { syncBirthday } from './birthday';
import { detachSupports, isValidSupport, moveWithSupports } from './placement';
import type { GiftRecord,AlbumEntry, Outfit, PlacedItem, SaveData } from './types';

export type Rng = () => number;

// ---------- learning ----------

export function recordAnswer(save: SaveData, rec: AnswerRecord, now: number): SaveData {
  return { ...save, learning: applyOutcome(save.learning, rec, now) };
}

export function recordMatch(save: SaveData, keys: FactKey[]): SaveData {
  return { ...save, learning: applyRecognition(save.learning, keys) };
}

export interface RoundResult {
  save: SaveData;
  reward: RoundReward;
  gift:GiftRecord|null;
  milestone: { days: number; coins: number } | null;
}

export function completeRound(save: SaveData, round: Round, outcomes: Outcome[], now: number): RoundResult {
  if(!round.steps.length)return {save,reward:{base:0,independentBonus:0,total:0},gift:null,milestone:null};
  const claim=claimMission(save,'round:'+round.steps[0].id,now);
  if(!claim.claimed)return {save,reward:{base:0,independentBonus:0,total:0},gift:null,milestone:null};
  save=claim.save;
  const reward = roundReward(outcomes, round.mode);
  let s: SaveData = {
    ...save,
    learning: finishRoundLog(save.learning, now),
    progress: { ...save.progress, roundsCompleted: save.progress.roundsCompleted + 1 },
  };
  s = addCoins(s, reward.total);
  const day = registerPracticeDay(s, now);
  return { save: day.save, reward, gift:claim.gift,milestone: day.milestone };
}

// ---------- "לומדות וזוכרות" ----------

export function saveLearnSession(save: SaveData, session: LearnSession | null): SaveData {
  return { ...save, learning: { ...save.learning, learnSession: session } };
}

export function startLearnSession(save: SaveData, now: number, rng: Rng = Math.random): SaveData {
  const keys = chooseLearnSet(save.learning, save.settings.tables, now);
  if (keys.length === 0) return save;
  const learning = { ...save.learning, learnSet: keys };
  return { ...save, learning: { ...learning, learnSession: buildLearnSession(learning, keys, now, rng) } };
}

export function completeLearnSession(save: SaveData, session: LearnSession, now: number): { save: SaveData; coins: number; gift:GiftRecord|null; milestone: { days: number; coins: number } | null } {
  const claim=claimMission(save,'learn:'+session.id,now);
  if(!claim.claimed)return {save,coins:0,gift:null,milestone:null};
  save=claim.save;
  const coins = learnReward(session);
  let s: SaveData = { ...save, learning: finishLearnLog(save.learning, session, now) };
  s = addCoins(s, coins);
  const day = registerPracticeDay(s, now);
  // a finished learning session (help counts) opens another design period
  return { save: grantPlay(syncBirthday(day.save)), coins,gift:claim.gift, milestone: day.milestone };
}

export function lookToOutfit(look: LearnSession['look']): Outfit {
  const outfit: Outfit = {};
  for (const id of Object.values(look)) {
    const item = id ? wearableById(id) : undefined;
    if (item) outfit[item.slot] = { itemId: item.id, color: item.color };
  }
  return outfit;
}

// ---------- clients ----------

export interface Client {
  dogId: string;
  requestId: string;
}

export function pickClient(save: SaveData, rng: Rng = Math.random): Client {
  if (save.progress.clientsServed === 0 && save.progress.recentDogs.length === 0) {
    const dogId = save.profile.ownDogId === 'pitzi' ? 'lola' : 'pitzi';
    return { dogId, requestId: 'birthday' };
  }
  const dogs = DOGS.filter((d) => d.id !== save.profile.ownDogId && !save.progress.recentDogs.includes(d.id));
  const reqs = REQUESTS.filter((r) => !save.progress.recentRequests.includes(r.id));
  const dogPool = dogs.length ? dogs : DOGS.filter((d) => d.id !== save.profile.ownDogId);
  const reqPool = reqs.length ? reqs : REQUESTS;
  return {
    dogId: dogPool[Math.floor(rng() * dogPool.length)].id,
    requestId: reqPool[Math.floor(rng() * reqPool.length)].id,
  };
}

export function noteClientArrived(save: SaveData, client: Client): SaveData {
  return {
    ...save,
    progress: {
      ...save.progress,
      recentDogs: [...save.progress.recentDogs.filter((d) => d !== client.dogId), client.dogId].slice(-4),
      recentRequests: [...save.progress.recentRequests.filter((r) => r !== client.requestId), client.requestId].slice(-6),
    },
  };
}

export function serveClient(save: SaveData, client: Client, outfit: Outfit): SaveData {
  return {
    ...save,
    outfits: { ...save.outfits, [client.dogId]: outfit },
    metDogs: save.metDogs.includes(client.dogId) ? save.metDogs : [...save.metDogs, client.dogId],
    progress: { ...save.progress, clientsServed: save.progress.clientsServed + 1 },
  };
}

// ---------- wardrobe ----------

export function equip(outfit: Outfit, itemId: string, color?: string): Outfit {
  const item = wearableById(itemId);
  if (!item) return outfit;
  return { ...outfit, [item.slot]: { itemId, color: color ?? outfit[item.slot]?.color ?? item.color } };
}

/** Tap an item: put it on, or take it off if it is already on. */
export function toggleItem(outfit: Outfit, itemId: string): Outfit {
  const item = wearableById(itemId);
  if (!item) return outfit;
  if (outfit[item.slot]?.itemId === itemId) {
    const next = { ...outfit };
    delete next[item.slot];
    return next;
  }
  return { ...outfit, [item.slot]: { itemId, color: item.color } };
}

/** Choose the dog that lives in the studio (free, any time). */
export function setStudioDog(save: SaveData, dogId: string): SaveData {
  if (!DOGS.some((d) => d.id === dogId)) return save;
  return {
    ...save,
    profile: { ...save.profile, ownDogId: dogId },
    metDogs: save.metDogs.includes(dogId) ? save.metDogs : [...save.metDogs, dogId],
  };
}

export function setOwnOutfit(save: SaveData, dogId: string, outfit: Outfit): SaveData {
  return { ...save, outfits: { ...save.outfits, [dogId]: outfit } };
}

// ---------- album ----------

export function addPhoto(
  save: SaveData,
  photo: { dogId: string; outfit: Outfit; backdrop: BackdropId; title: string; request: ClientRequest | null; directionId: string | null; stars: number },
  now: number,
  rewardStyle: boolean
): { save: SaveData; entry: AlbumEntry; bonus: number } {
  const entry: AlbumEntry = {
    id: `a${now.toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    dogId: photo.dogId,
    outfit: photo.outfit,
    backdrop: photo.backdrop,
    title: photo.title.trim().slice(0, 40) || 'לוק בלי שם',
    requestId: photo.request?.id ?? null,
    directionId: photo.directionId,
    stars: photo.stars,
    createdAt: now,
  };
  const bonus = rewardStyle ? photo.stars * STYLE_COIN_PER_STAR : 0;
  let s: SaveData = { ...save, album: [...save.album, entry] };
  s = addCoins(s, bonus);
  return { save: s, entry, bonus };
}

export function renamePhoto(save: SaveData, id: string, title: string): SaveData {
  const t = title.trim().slice(0, 40);
  if (!t) return save;
  return { ...save, album: save.album.map((e) => (e.id === id ? { ...e, title: t } : e)) };
}

export function deletePhoto(save: SaveData, id: string): SaveData {
  return { ...save, album: save.album.filter((e) => e.id !== id) };
}

// ---------- studio ----------

export const placedUid = (now: number) => `p${now.toString(36)}`;

export function placeFurniture(save: SaveData, itemId: string, now: number): SaveData {
  const f = furnitureById(itemId);
  if (!f || !save.owned.furniture.includes(itemId)) return save;
  if (save.studio.items.some((p) => p.itemId === itemId)) return save;
  const y = f.kind === 'ceiling' ? f.h + 10 : f.kind === 'wall' ? 240 : f.kind === 'rug' ? 450 : 420;
  const item: PlacedItem = { uid: placedUid(now), itemId, x: f.kind === 'floor' ? 560 : 400, y, scale: 1, flip: false };
  return { ...save, studio: { ...save.studio, items: [...save.studio.items, item] } };
}

const clampItemX = (x:number) => Math.min(1180,Math.max(-380,x));
const clampItemY = (y:number) => Math.min(500,Math.max(40,y));
const clampDogX = (x:number) => Math.min(1160,Math.max(-360,x));
const clampDogY = (y:number) => Math.min(495,Math.max(340,y));

function validSupportGraph(save:SaveData):boolean {
  const entries=new Map([...save.studio.items.map(p=>[p.uid,p] as const),['__dog__',save.studio.dog] as const]);
  if(entries.size!==save.studio.items.length+1)return false;
  const checked=new Set<string>();
  for(const id of entries.keys()) {
    const path=new Set<string>();
    let at:string|undefined=id;
    while(at&&entries.has(at)&&!checked.has(at)) {
      if(path.has(at))return false;
      path.add(at);at=entries.get(at)?.supportUid;
    }
    for(const uid of path)checked.add(uid);
  }
  return true;
}

function supportedTree(save:SaveData,uid:string):Set<string> {
  const ids=new Set([uid]);
  const entries=[...save.studio.items.map(p=>({uid:p.uid,supportUid:p.supportUid})),
    {uid:'__dog__',supportUid:save.studio.dog.supportUid}];
  // Set iteration visits newly added descendants, without recursion depth limits.
  for(const host of ids)for(const p of entries)if(p.supportUid===host)ids.add(p.uid);
  return ids;
}

/** Geometry changes/removal safely place the affected branch on the floor. */
function floorSupports(save:SaveData,uid:string,includeRoot=false):SaveData {
  const falling=supportedTree(save,uid);
  if(!includeRoot)falling.delete(uid);
  let next=detachSupports(save,uid);
  if(!falling.size)return next;
  const items=next.studio.items.map(p=>{
    if(!falling.has(p.uid))return p;
    const copy={...p,x:clampItemX(p.x),y:420};delete copy.supportUid;return copy;
  });
  let dog=next.studio.dog;
  if(falling.has('__dog__'))dog={x:clampDogX(dog.x),y:465};
  next={...next,studio:{...next.studio,items,dog}};
  return next;
}

export function updatePlaced(save: SaveData, uid: string, patch: Partial<Omit<PlacedItem, 'uid' | 'itemId'>>): SaveData {
  const original=save.studio.items.find(p=>p.uid===uid);
  if(!original||!validSupportGraph(save))return save;
  if([patch.x,patch.y,patch.scale].some(n=>n!==undefined&&!Number.isFinite(n)))return save;
  const x=clampItemX(patch.x??original.x),y=clampItemY(patch.y??original.y);
  const scale=Math.min(1.6,Math.max(0.5,patch.scale??original.scale));
  const moving=patch.x!==undefined||patch.y!==undefined;
  const geometry=scale!==original.scale||(patch.flip!==undefined&&patch.flip!==original.flip);
  let next=moveWithSupports(save,uid,x,y);
  // A rejected translation must never become a partial metadata update.
  if((x!==original.x||y!==original.y)&&next===save)return save;
  if(geometry)next=floorSupports(next,uid);
  // Carrying a branch must not bypass the existing world-coordinate bounds.
  const carried=supportedTree(next,uid);carried.delete(uid);
  for(const id of carried) {
    const node=id==='__dog__'?next.studio.dog:next.studio.items.find(p=>p.uid===id)!;
    const inBounds=id==='__dog__'
      ?node.x===clampDogX(node.x)&&node.y===clampDogY(node.y)
      :node.x===clampItemX(node.x)&&node.y===clampItemY(node.y);
    if(!inBounds)next=floorSupports(next,id,true);
  }
  let updated={...next.studio.items.find(p=>p.uid===uid)!,...patch,x,y,scale};
  const explicitSupport=Object.prototype.hasOwnProperty.call(patch,'supportUid');
  if(moving||geometry||explicitSupport)delete updated.supportUid;
  next={...next,studio:{...next.studio,items:next.studio.items.map(p=>p.uid===uid?updated:p)}};
  if(explicitSupport&&patch.supportUid) {
    const host=next.studio.items.find(p=>p.uid===patch.supportUid);
    if(host&&next.owned.furniture.includes(host.itemId)&&isValidSupport(next.studio,uid,host.uid)) {
      updated={...updated,supportUid:host.uid};
      next={...next,studio:{...next.studio,items:next.studio.items.map(p=>p.uid===uid?updated:p)}};
    }
  }
  return next;
}

export function removePlaced(save: SaveData, uid: string): SaveData {
  if(!save.studio.items.some(p=>p.uid===uid)||!validSupportGraph(save))return save;
  const next=floorSupports(save,uid);
  return {...next,studio:{...next.studio,items:next.studio.items.filter(p=>p.uid!==uid)}};
}

export function moveDog(save: SaveData, x: number, y: number): SaveData {
  if(!Number.isFinite(x)||!Number.isFinite(y)||!validSupportGraph(save))return save;
  return { ...save, studio: { ...save.studio, dog: { x:clampDogX(x),y:clampDogY(y) } } };
}
