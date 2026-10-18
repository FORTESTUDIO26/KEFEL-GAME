// Local save: versioned schema, validation, repair, import/export.
// Nothing is ever deleted silently: a damaged save is kept as a backup copy.

import {
  RARE_ITEMS,
  BACKDROPS,
  BACKGROUNDS,
  FREE_BACKGROUNDS,
  FREE_FURNITURE,
  FREE_WEARABLES,
  LEGACY_FREE_WEARABLES,
  LEGACY_FREE_FURNITURE,
  PALETTES,
  SLOT_ORDER,
  furnitureById,
  wearableById,
  type BackdropId,
} from '../content/catalog';
import { DOGS } from '../content/dogs';
import { emptyLearning, type DailyLog, type LearningData } from '../learning/data';
import { SET_SIZE, type DesignSlot, type LearnSession, type LearnStep } from '../learning/learnPath';
import { isValidKey } from '../learning/facts';
import { computeState, emptyStats, MAX_STAGE, type FactStats } from '../learning/scheduler';
import { SCHEMA_VERSION, type AlbumEntry, type Outfit, type PlacedItem, type RoomLayout, type SaveData } from './types';
import { isValidSupport } from './placement';
import { DOG_LAYER_ID } from './layers';
import {defaultBirthday,sanitizeBirthday,birthdayVisit,type BirthdayData} from './birthday';
import { CHALLENGE_SIZE,defaultWorld,kitchenStarterItems,ROOMS } from './world';
import { HUMAN_PREFIX, isCharacter, sanitizeHumanOutfit } from './characters';
import { DEFAULT_LIMIT_MIN, defaultPlayTime, LIMIT_CHOICES } from './playTime';
import type { WorldData } from './types';

export const SAVE_KEY = 'liori-studio:save';
export const BACKUP_PREFIX = 'liori-studio:backup:';
export const EXPORT_APP_ID = 'liori-studio';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function defaultSave(now: number): SaveData {
  return {
    birthday:defaultBirthday(),
    rewards:{claimed:[],gifts:[]},
    playTime: defaultPlayTime(),
    version: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    profile: { studioName: 'הסטודיו של ליאורי', paletteId: 'lilac', ownDogId: 'bosko', onboarded: false },
    coins: 0,
    totalEarned: 0,
    owned: { wearables: [...FREE_WEARABLES], furniture: [...FREE_FURNITURE], backgrounds: [...FREE_BACKGROUNDS] },
    studio: {
      wall: 'wall_stripes',
      floor: 'floor_wood',
      items: [
        { uid: 'start-rug', itemId: 'rug_round', x: 400, y: 440, scale: 1, flip: false },
        { uid: 'start-sofa', itemId: 'sofa', x: 180, y: 390, scale: 1, flip: false },
        { uid: 'start-mirror', itemId: 'mirror_tall', x: 660, y: 380, scale: 1, flip: false },
        { uid: 'start-plant', itemId: 'plant_monstera', x: 560, y: 360, scale: 0.9, flip: false },
        { uid: 'start-frame', itemId: 'frame', x: 330, y: 190, scale: 1, flip: false },
      ],
      dog: { x: 420, y: 465 },
    },
    outfits: {},
    world: defaultWorld(),
    metDogs: [],
    album: [],
    learning: emptyLearning(),
    progress: {
      roundsCompleted: 0,
      clientsServed: 0,
      practiceDays: [],
      milestonesClaimed: [],
      recentRequests: [],
      recentDogs: [],
    },
    settings: { tables: [...ALL_TABLES], sound: true, reduceMotion: false },
    tips: [],
  };
}

// ---------- small type guards ----------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function int(v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return isNum(v) ? Math.min(max, Math.max(min, Math.round(v))) : def;
}
function numIn(v: unknown, def: number, min: number, max: number): number {
  return isNum(v) ? Math.min(max, Math.max(min, v)) : def;
}
function str(v: unknown, def: string, maxLen = 60): string {
  return typeof v === 'string' ? v.slice(0, maxLen) : def;
}
function timeOrNull(v: unknown): number | null {
  return isNum(v) && v > 0 ? v : null;
}
function idList(v: unknown, valid: (id: string) => boolean): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === 'string' && valid(x)))];
}
function dayList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === 'string' && DAY_RE.test(x)))].slice(-60);
}

// ---------- sanitizers ----------

function sanitizeFact(key: string, v: unknown): FactStats {
  const base = emptyStats(key);
  if (!isObj(v)) return base;
  const s: FactStats = {
    key,
    attempts: int(v.attempts, 0),
    correct: int(v.correct, 0),
    wrong: int(v.wrong, 0),
    hintUses: int(v.hintUses, 0),
    independentCorrect: int(v.independentCorrect, 0),
    hintedCorrect: int(v.hintedCorrect, 0),
    supported: int(v.supported, 0),
    afterHelpCorrect: int(v.afterHelpCorrect, 0),
    streak: int(v.streak, 0),
    stage: int(v.stage, 0, 0, MAX_STAGE),
    lastPracticed: timeOrNull(v.lastPracticed),
    nextDue: timeOrNull(v.nextDue),
    state: 'new',
    cleanDays: dayList(v.cleanDays),
    independentDays: dayList(v.independentDays),
    seenAB: int(v.seenAB, 0),
    seenBA: int(v.seenBA, 0),
    recognition: int(v.recognition, 0),
    lastMissDay: typeof v.lastMissDay === 'string' && DAY_RE.test(v.lastMissDay) ? v.lastMissDay : null,
    lastAskedQ: isNum(v.lastAskedQ) && v.lastAskedQ >= 0 ? Math.round(v.lastAskedQ) : null,
    helpQ: isNum(v.helpQ) && v.helpQ >= 0 ? Math.round(v.helpQ) : null,
  };
  s.state = computeState(s);
  return s;
}

function sanitizeDaily(v: unknown): Record<string, DailyLog> {
  const out: Record<string, DailyLog> = {};
  if (!isObj(v)) return out;
  for (const [day, log] of Object.entries(v)) {
    if (!DAY_RE.test(day) || !isObj(log)) continue;
    out[day] = {
      questions: int(log.questions, 0),
      independent: int(log.independent, 0),
      hinted: int(log.hinted, 0),
      wrong: int(log.wrong, 0),
      supported: int(log.supported, 0),
      afterHelp: int(log.afterHelp, 0),
      rounds: int(log.rounds, 0),
      learnSessions: int(log.learnSessions, 0),
    };
  }
  return out;
}

const HEX_RE = /^#[0-9a-f]{6}$/i;
const DESIGN_SLOT_IDS = ['body', 'neck', 'head', 'feet', 'prop'];

/** A session stopped in the middle. Anything malformed is dropped (answers given are already saved). */
function sanitizeLearnSession(v: unknown): LearnSession | null {
  if (!isObj(v) || !Array.isArray(v.steps) || !Array.isArray(v.keys)) return null;
  const keys = idList(v.keys, isValidKey);
  if (keys.length === 0) return null;
  const steps: LearnStep[] = [];
  for (const st of v.steps) {
    if (!isObj(st) || typeof st.id !== 'string') return null;
    if (st.type === 'study' && Array.isArray(st.pair) && st.pair.every((k) => typeof k === 'string' && isValidKey(k)))
      steps.push({ type: 'study', id: st.id, pair: st.pair as string[] });
    else if (st.type === 'design' && typeof st.slot === 'string' && DESIGN_SLOT_IDS.includes(st.slot))
      steps.push({
        type: 'design',
        id: st.id,
        slot: st.slot as DesignSlot,
        ...(Array.isArray(st.forPair) ? { forPair: idList(st.forPair, isValidKey) } : {}),
      });
    else if (st.type === 'recall' && typeof st.key === 'string' && isValidKey(st.key) && isNum(st.a) && isNum(st.b) && st.a * st.b > 0)
      steps.push({ type: 'recall', id: st.id, key: st.key, a: st.a, b: st.b, retry: st.retry === true, ...(st.check === true ? { check: true } : {}), ...(st.planned === true ? { planned: true } : {}) });
    else if (st.type === 'finish') steps.push({ type: 'finish', id: st.id });
    else return null;
  }
  if (!steps.length) return null;
  const look: LearnSession['look'] = {};
  if (isObj(v.look)) {
    for (const [slot, id] of Object.entries(v.look))
      if (DESIGN_SLOT_IDS.includes(slot) && typeof id === 'string' && wearableById(id)) look[slot as keyof LearnSession['look']] = id;
  }
  const retries: Record<string, number> = {};
  if (isObj(v.retries)) for (const [k, n] of Object.entries(v.retries)) if (isValidKey(k)) retries[k] = int(n, 0, 0, 5);
  return {
    id: str(v.id, 'L', 40),
    startedAt: isNum(v.startedAt) ? v.startedAt : 0,
    keys,
    pairs: Array.isArray(v.pairs) ? v.pairs.map((pr) => idList(pr, isValidKey)).filter((pr) => pr.length > 0) : [keys],
    extraSupport: v.extraSupport === true,
    steps,
    index: int(v.index, 0, 0, steps.length - 1),
    retries,
    alone: int(v.alone, 0),
    afterHelp: int(v.afterHelp, 0),
    helped: int(v.helped, 0),
    checkAlone: int(v.checkAlone, 0),
    checkTotal: int(v.checkTotal, 0),
    answeredStepId: typeof v.answeredStepId === 'string' ? v.answeredStepId : null,
    checkedOk: idList(v.checkedOk, isValidKey),
    aloneKeys: idList(v.aloneKeys, isValidKey),
    look,
  };
}

function sanitizeLearning(v: unknown): LearningData {
  const base = emptyLearning();
  if (!isObj(v)) return base;
  const facts: Record<string, FactStats> = {};
  if (isObj(v.facts)) {
    for (const [k, f] of Object.entries(v.facts)) if (isValidKey(k)) facts[k] = sanitizeFact(k, f);
  }
  // The question counter can never be behind a fact's own question numbers.
  const questionCount = Math.max(int(v.questionCount, 0), ...Object.values(facts).flatMap((f) => [f.lastAskedQ ?? 0, f.helpQ ?? 0]));
  const newByDay: Record<string, number> = {};
  if (isObj(v.newByDay)) {
    for (const [d, n] of Object.entries(v.newByDay)) if (DAY_RE.test(d)) newByDay[d] = int(n, 0);
  }
  return {
    facts,
    daily: sanitizeDaily(v.daily),
    newByDay,
    learnSet: idList(v.learnSet, isValidKey).slice(0, SET_SIZE),
    learnSession: sanitizeLearnSession(v.learnSession),
    learnLog: Array.isArray(v.learnLog)
      ? v.learnLog
          .filter((r): r is Record<string, unknown> => isObj(r) && typeof r.day === 'string' && DAY_RE.test(r.day))
          .map((r) => ({ day: r.day as string, alone: int(r.alone, 0), total: int(r.total, 0) }))
          .slice(-20)
      : [],
    questionCount,
    learnFocus: idList(v.learnFocus, isValidKey).slice(0, 10),
  };
}

/** `owned` null = accept any catalog item (album photos keep pieces as they were). */
function sanitizeOutfit(v: unknown, ownedWearables: string[] | null): Outfit {
  const out: Outfit = {};
  if (!isObj(v)) return out;
  for (const slot of SLOT_ORDER) {
    const p = v[slot];
    if (!isObj(p) || typeof p.itemId !== 'string') continue;
    const item = wearableById(p.itemId);
    if (!item || item.slot !== slot || (ownedWearables && !ownedWearables.includes(item.id))) continue;
    out[slot] = { itemId: item.id, color: typeof p.color === 'string' && /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : item.color };
  }
  return out;
}

const isDog = (id: string) => DOGS.some((d) => d.id === id);
const isBackdrop = (id: unknown): id is BackdropId => BACKDROPS.some((b) => b.id === id);

function sanitizePlaced(v: unknown, owned: string[]): PlacedItem[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: PlacedItem[] = [];
  for (const p of v) {
    const character = isObj(p) && typeof p.itemId === 'string' && isCharacter(p.itemId);
    if (!isObj(p) || typeof p.itemId !== 'string' || (!character && (!furnitureById(p.itemId) || !owned.includes(p.itemId)))) continue;
    const uid = str(p.uid, `p${out.length}`, 40);
    if (uid === DOG_LAYER_ID || seen.has(uid)) continue;
    seen.add(uid);
    out.push({
      uid,
      ...(typeof p.supportUid==='string'?{supportUid:p.supportUid.slice(0,40)}:{}),
      itemId: p.itemId,
      x: numIn(p.x, 400, -380, 1180),
      y: numIn(p.y, 400, 0, 500),
      scale: numIn(p.scale, 1, 0.5, 1.6),
      flip: p.flip === true,
      ...(typeof p.color === 'string' && HEX_RE.test(p.color) ? { color: p.color } : {}),
      ...(character && p.itemId.startsWith(HUMAN_PREFIX) && sanitizeHumanOutfit(p.outfit) ? { outfit: sanitizeHumanOutfit(p.outfit) } : {}),
    });
  }
  return out.slice(0, 80);
}

function sanitizeRoomLinks(room: RoomLayout): RoomLayout {
  const items = room.items.map(item => ({ ...item }));
  const dog = { ...room.dog };
  const repaired = { ...room, items, dog };
  const byUid = new Map(items.map(item => [item.uid, item]));

  // Repair the graph before compatibility checks: isValidSupport intentionally
  // rejects an entire cyclic room, including otherwise healthy components.
  for (const item of items) {
    if (item.supportUid !== undefined && (!byUid.has(item.supportUid) || item.supportUid === item.uid)) delete item.supportUid;
  }
  if (dog.supportUid !== undefined && !byUid.has(dog.supportUid)) delete dog.supportUid;
  const cyclic = new Set<string>();
  for (const item of items) {
    const path: string[] = [];
    const indices = new Map<string, number>();
    let at: string | undefined = item.uid;
    while (at !== undefined) {
      const index = indices.get(at);
      if (index !== undefined) {
        for (const uid of path.slice(index)) cyclic.add(uid);
        break;
      }
      indices.set(at, path.length);
      path.push(at);
      at = byUid.get(at)?.supportUid;
    }
  }
  // Remove every cycle edge together, independent of saved item order. Children
  // of a repaired host can keep their own compatible attachment in place.
  for (const uid of cyclic) delete byUid.get(uid)!.supportUid;
  for (const item of items) {
    if (item.supportUid !== undefined && !isValidSupport(repaired, item.uid, item.supportUid)) delete item.supportUid;
  }
  if (dog.supportUid !== undefined && !isValidSupport(repaired, DOG_LAYER_ID, dog.supportUid)) delete dog.supportUid;
  return repaired;
}

function sanitizeAlbum(v: unknown): AlbumEntry[] {
  if (!Array.isArray(v)) return [];
  const out: AlbumEntry[] = [];
  for (const e of v) {
    if (!isObj(e) || typeof e.dogId !== 'string' || !isDog(e.dogId)) continue;
    out.push({
      id: str(e.id, `a${out.length}`, 40),
      dogId: e.dogId,
      outfit: sanitizeOutfit(e.outfit, null),
      backdrop: isBackdrop(e.backdrop) ? e.backdrop : 'studio',
      title: str(e.title, 'לוק בלי שם', 40),
      requestId: typeof e.requestId === 'string' ? e.requestId : null,
      directionId: typeof e.directionId === 'string' ? e.directionId : null,
      stars: int(e.stars, 0, 0, 3),
      createdAt: isNum(e.createdAt) ? e.createdAt : 0,
    });
  }
  return out.slice(-300);
}

function sanitizeWorld(raw:unknown,furniture:string[],backgrounds:string[],learning:LearningData,birthday:BirthdayData):WorldData {
 const d=defaultWorld();if(!isObj(raw))return d;
 const unlocked=idList(raw.unlocked,id=>ROOMS.some(r=>r.id===id)) as WorldData['unlocked'];
 d.unlocked=[...new Set(['studio' as const,...unlocked])];
 if(typeof raw.activeRoom==='string'&&(d.unlocked.includes(raw.activeRoom as WorldData['activeRoom'])||ROOMS.some(r=>r.id===raw.activeRoom)&&birthdayVisit(birthday,raw.activeRoom as WorldData['activeRoom'])))d.activeRoom=raw.activeRoom as WorldData['activeRoom'];
 const rooms=isObj(raw.rooms)?raw.rooms:{};
 for(const id of ['dressing','garden','stage','cafe','craft','kitchen','bathroom'] as const){
  const room=isObj(rooms[id])?rooms[id]:{};const dog=isObj(room.dog)?room.dog:{};
  d.rooms[id]=sanitizeRoomLinks({wall:typeof room.wall==='string'&&backgrounds.includes(room.wall)?room.wall:d.rooms[id].wall,floor:typeof room.floor==='string'&&backgrounds.includes(room.floor)?room.floor:d.rooms[id].floor,items:sanitizePlaced(room.items,furniture),order:Array.isArray(room.order)?idList(room.order,id=>id==='__dog__'||sanitizePlaced(room.items,furniture).some(p=>p.uid===id)):undefined,dog:{x:numIn(dog.x,420,-360,1160),y:numIn(dog.y,465,0,500),...(typeof dog.supportUid==='string'?{supportUid:dog.supportUid}:{})}});
 }
 const o=raw.opening;
 if(isObj(o)&&['dressing','garden','stage','cafe','craft','kitchen','bathroom'].includes(String(o.roomId))&&!d.unlocked.includes(o.roomId as WorldData['activeRoom'])&&Array.isArray(o.facts)){
  const facts=idList(o.facts,key=>isValidKey(key)&&(learning.facts[key]?.attempts??0)>0);
  // A challenge stopped in the middle continues; an older 4-fact opening is dropped (it simply restarts).
  if(facts.length===CHALLENGE_SIZE&&new Set(facts).size===facts.length&&isNum(o.index)&&Number.isInteger(o.index)&&o.index>=0&&o.index<=facts.length){
   const finished=o.finished===true||o.index===facts.length;
   d.opening={roomId:o.roomId as 'dressing'|'garden'|'stage'|'cafe'|'craft'|'kitchen'|'bathroom',facts,index:o.index,helped:o.helped===true&&!finished,score:int(o.score,0,0,o.index),missed:idList(o.missed,k=>facts.includes(k)),finished};
  }
 }
 const activities=isObj(raw.activities)?raw.activities:{};
 d.activities={garden:int(activities.garden,0,0,100000),stage:int(activities.stage,0,0,100000),cafe:int(activities.cafe,0,0,100000),craft:int(activities.craft,0,0,100000),kitchen:int(activities.kitchen,0,0,100000),bathroom:int(activities.bathroom,0,0,100000)};
 return d;
}

/** Build a full, valid SaveData from anything, keeping every valid part. */
export function sanitize(raw: unknown, now: number): SaveData {
  const d = defaultSave(now);
  if (!isObj(raw)) return d;

  const profile = isObj(raw.profile) ? raw.profile : {};
  const ownedRaw = isObj(raw.owned) ? raw.owned : {};
  const wearables = [...new Set([...FREE_WEARABLES, ...idList(ownedRaw.wearables, (id) => !!wearableById(id))])];
  const furniture = [...new Set([...FREE_FURNITURE, ...idList(ownedRaw.furniture, (id) => !!furnitureById(id))])];
  const backgrounds = [
    ...new Set([...FREE_BACKGROUNDS, ...idList(ownedRaw.backgrounds, (id) => BACKGROUNDS.some((b) => b.id === id))]),
  ];

  const studioRaw = isObj(raw.studio) ? raw.studio : {};
  const wall = typeof studioRaw.wall === 'string' && backgrounds.includes(studioRaw.wall) ? studioRaw.wall : d.studio.wall;
  const floor = typeof studioRaw.floor === 'string' && backgrounds.includes(studioRaw.floor) ? studioRaw.floor : d.studio.floor;
  const dogPos = isObj(studioRaw.dog) ? studioRaw.dog : {};

  const outfits: SaveData['outfits'] = {};
  if (isObj(raw.outfits)) {
    for (const [dogId, o] of Object.entries(raw.outfits)) if (isDog(dogId)) outfits[dogId] = sanitizeOutfit(o, wearables);
  }

  const progress = isObj(raw.progress) ? raw.progress : {};
  const settings = isObj(raw.settings) ? raw.settings : {};
  const tables = Array.isArray(settings.tables)
    ? [...new Set(settings.tables.filter((t): t is number => isNum(t) && ALL_TABLES.includes(t)))].sort((a, b) => a - b)
    : ALL_TABLES;

  const ownDogId = typeof profile.ownDogId === 'string' && isDog(profile.ownDogId) ? profile.ownDogId : d.profile.ownDogId;

  return {
    version: SCHEMA_VERSION,
    createdAt: isNum(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : now,
    profile: {
      studioName: str(profile.studioName, d.profile.studioName, 40).trim() || d.profile.studioName,
      paletteId: typeof profile.paletteId === 'string' && PALETTES.some((p) => p.id === profile.paletteId) ? profile.paletteId : 'lilac',
      ownDogId,
      onboarded: profile.onboarded === true,
    },
    coins: int(raw.coins, 0, 0, 1_000_000),
    totalEarned: int(raw.totalEarned, 0, 0, 10_000_000),
    owned: { wearables, furniture, backgrounds },
    birthday:sanitizeBirthday(raw.birthday),
    studio: sanitizeRoomLinks({
      wall,
      floor,
      items: Array.isArray(studioRaw.items) ? sanitizePlaced(studioRaw.items, furniture) : d.studio.items,
      order: Array.isArray(studioRaw.order)?idList(studioRaw.order,id=>id==='__dog__'||sanitizePlaced(studioRaw.items,furniture).some(p=>p.uid===id)):undefined,
      dog: { x: numIn(dogPos.x, d.studio.dog.x, -360, 1160), y: numIn(dogPos.y, d.studio.dog.y, 0, 500),...(typeof dogPos.supportUid==='string'?{supportUid:dogPos.supportUid}:{}) },
    }),
    rewards: sanitizeRewards(raw.rewards),
    outfits,
    world: sanitizeWorld(raw.world,furniture,backgrounds,sanitizeLearning(raw.learning),sanitizeBirthday(raw.birthday)),
    metDogs: idList(raw.metDogs, isDog),
    album: sanitizeAlbum(raw.album),
    learning: sanitizeLearning(raw.learning),
    progress: {
      roundsCompleted: int(progress.roundsCompleted, 0),
      clientsServed: int(progress.clientsServed, 0),
      practiceDays: dayList(progress.practiceDays),
      milestonesClaimed: Array.isArray(progress.milestonesClaimed)
        ? [...new Set(progress.milestonesClaimed.filter((n): n is number => isNum(n)))]
        : [],
      recentRequests: idList(progress.recentRequests, () => true).slice(-6),
      recentDogs: idList(progress.recentDogs, isDog).slice(-4),
    },
    settings: {
      tables: tables.length ? tables : ALL_TABLES,
      sound: settings.sound !== false,
      reduceMotion: settings.reduceMotion === true,
    },
    tips: idList(raw.tips, () => true).slice(0, 50),
    playTime: sanitizePlayTime(raw.playTime),
  };
}

function sanitizePlayTime(raw: unknown): SaveData['playTime'] {
  if (!isObj(raw)) return defaultPlayTime();
  const limitMin = isNum(raw.limitMin) && LIMIT_CHOICES.includes(raw.limitMin) ? raw.limitMin : DEFAULT_LIMIT_MIN;
  return { usedMs: int(raw.usedMs, 0, 0, 24 * 3600_000), limitMin, warned: raw.warned === true };
}

function sanitizeRewards(raw:unknown):SaveData['rewards']{
 if(!isObj(raw))return {claimed:[],gifts:[]};
 const claimed=idList(raw.claimed,id=>id.length>0&&id.length<160);
 const seen=new Set<string>();
 const gifts:SaveData['rewards']['gifts']=[];
 if(Array.isArray(raw.gifts))for(const g of raw.gifts){
  if(!isObj(g)||typeof g.missionId!=='string'||!claimed.includes(g.missionId)||seen.has(g.missionId))continue;
  const item=RARE_ITEMS.find(r=>r.id===g.id&&r.kind===g.kind);if(!item)continue;
  seen.add(g.missionId);gifts.push({...item,missionId:g.missionId,at:int(g.at,0)});
 }
 return {claimed,gifts};
}
// ---------- validation & migration ----------

export type ValidationResult = { ok: true; data: SaveData } | { ok: false; errors: string[] };

/** Upgrade older save shapes. Version 1 is the first; future versions add steps here. */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // 7 → 8: question counter, room challenge, play-time balance (defaults in sanitize()).
  // An empty kitchen gets the ready-made kitchen; a kitchen she already designed is kept as it is.
  // 8 → 9: free design time is now 10 minutes per lesson (it was 30; other choices are kept).
  8: (raw) => {
    const pt = isObj(raw.playTime) ? raw.playTime : null;
    if (!pt || pt.limitMin !== 30) return raw;
    return { ...raw, playTime: { ...pt, limitMin: DEFAULT_LIMIT_MIN, usedMs: Math.min(int(pt.usedMs, 0), DEFAULT_LIMIT_MIN * 60_000), warned: false } };
  },
  7: (raw) => {
    const world = isObj(raw.world) ? raw.world : null;
    const rooms = world && isObj(world.rooms) ? world.rooms : null;
    const kitchen = rooms && isObj(rooms.kitchen) ? rooms.kitchen : null;
    if (!world || !rooms || !kitchen || (Array.isArray(kitchen.items) && kitchen.items.length > 0)) return raw;
    return { ...raw, world: { ...world, rooms: { ...rooms, kitchen: { ...kitchen, items: kitchenStarterItems() } } } };
  },
  6: (raw) => raw,
  5: (raw) => raw,
  4: (raw) => raw,
  3: (raw) => raw,
  2: (raw) => {
    const owned=isObj(raw.owned)?raw.owned:{};
    return {...raw,owned:{...owned,wearables:[...new Set([...idList(owned.wearables,()=>true),...LEGACY_FREE_WEARABLES])],furniture:[...new Set([...idList(owned.furniture,()=>true),...LEGACY_FREE_FURNITURE])]}};
  },
  // 1 → 2: "לומדות וזוכרות" fields and furniture colours are new and get defaults in sanitize();
  // the old warm-up fields are no longer used. New free items are granted by sanitize() as well.
  1: (raw) => {
    const learning = isObj(raw.learning) ? { ...raw.learning } : raw.learning;
    if (isObj(learning)) {
      delete learning.warmupDone;
      delete learning.level;
    }
    return { ...raw, learning };
  },
};

export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  let cur = raw;
  let v = int(cur.version, 0);
  while (v < SCHEMA_VERSION && MIGRATIONS[v]) {
    cur = MIGRATIONS[v](cur);
    v += 1;
    cur = { ...cur, version: v };
  }
  return cur;
}

/**
 * Strict check: the core structure must be present and well-typed.
 * Smaller problems (unknown item ids, odd numbers) are repaired, not rejected.
 */
export function validateSave(raw: unknown, now: number): ValidationResult {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ['הקובץ אינו שמירה של המשחק.'] };
  if (!isNum(raw.version)) errors.push('חסר מספר גרסה.');
  else if (raw.version > SCHEMA_VERSION) errors.push('השמירה נוצרה בגרסה חדשה יותר של המשחק.');
  else if (raw.version < 1) errors.push('מספר גרסה לא תקין.');
  if (errors.length) return { ok: false, errors };

  const m = migrate(raw);
  if (!isObj(m.profile) || typeof m.profile.studioName !== 'string') errors.push('חסרים פרטי הסטודיו.');
  if (!isNum(m.coins) || m.coins < 0) errors.push('מספר המטבעות לא תקין.');
  if (!isObj(m.owned)) errors.push('חסרה רשימת הפריטים.');
  if (!isObj(m.learning) || !isObj(m.learning.facts)) errors.push('חסרים נתוני הלמידה.');
  if (!isObj(m.settings)) errors.push('חסרות הגדרות.');
  if (errors.length) return { ok: false, errors };
  return { ok: true, data: sanitize(m, now) };
}

// ---------- storage ----------

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function detectStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = 'liori-studio:probe';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export type LoadResult =
  | { status: 'new'; data: SaveData }
  | { status: 'ok'; data: SaveData }
  | { status: 'corrupt'; raw: string; errors: string[]; backupKey: string | null };

export function loadSave(storage: StorageLike, now: number): LoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    raw = null;
  }
  if (raw === null) return { status: 'new', data: defaultSave(now) };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', raw, errors: ['לא ניתן לקרוא את קובץ השמירה.'], backupKey: backupRaw(storage, raw, now) };
  }
  const v = validateSave(parsed, now);
  if (!v.ok) return { status: 'corrupt', raw, errors: v.errors, backupKey: backupRaw(storage, raw, now) };
  // Upgrading the data structure: keep an untouched copy of the older save first.
  if (isObj(parsed) && isNum(parsed.version) && parsed.version < SCHEMA_VERSION) backupRaw(storage, raw, now, `-before-v${SCHEMA_VERSION}`);
  return { status: 'ok', data: v.data };
}

/** Repair a damaged save, keeping whatever parts are still readable. */
export function repairFromRaw(raw: string, now: number): SaveData {
  try {
    const parsed = JSON.parse(raw);
    return sanitize(isObj(parsed) ? migrate(parsed) : parsed, now);
  } catch {
    return defaultSave(now);
  }
}

export function backupRaw(storage: StorageLike, raw: string, now: number, tag = ''): string | null {
  const key = `${BACKUP_PREFIX}${now}${tag}`;
  try {
    storage.setItem(key, raw);
    return key;
  } catch {
    return null;
  }
}

export function writeSave(storage: StorageLike, data: SaveData): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ---------- import / export ----------

export function exportText(data: SaveData, now: number): string {
  return JSON.stringify({ app: EXPORT_APP_ID, exportedAt: new Date(now).toISOString(), save: data }, null, 1);
}

export function parseImport(text: string, now: number): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['הקובץ אינו קובץ שמירה תקין (JSON).'] };
  }
  if (isObj(parsed) && parsed.app === EXPORT_APP_ID && 'save' in parsed) return validateSave(parsed.save, now);
  if (isObj(parsed) && 'version' in parsed && 'learning' in parsed) return validateSave(parsed, now);
  return { ok: false, errors: ['הקובץ לא נראה כמו שמירה של הסטודיו של ליאורי.'] };
}
