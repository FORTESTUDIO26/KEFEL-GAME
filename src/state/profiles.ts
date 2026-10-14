import { BACKUP_PREFIX, backupRaw, defaultSave, loadSave, SAVE_KEY, writeSave, type StorageLike } from './save';
import type { SaveData } from './types';

export const PLAYERS_KEY = 'liori-studio:players';
const PLAYER_PREFIX = 'liori-studio:player:';
const ID_RE = /^[a-zA-Z0-9_-]{1,80}$/;
export interface Player { id: string; name: string; needsOwner: boolean; createdAt: number }
export interface PlayerLibrary { version: 1; players: Player[] }
export interface PlayerError { raw: string; errors: string[]; backupKey: string | null }
export type PlayersBoot =
  | {status:'ready';library:PlayerLibrary;saves:Record<string,SaveData>;errors:Record<string,PlayerError>;persistent:boolean}
  | {status:'corrupt';raw:string;message:string};

/** Reuse the existing save/import/backup API within one player's namespace. */
export function playerStorage(storage: StorageLike, id: string): StorageLike {
  if (!ID_RE.test(id)) throw new Error('Invalid player id');
  const key = (k: string) => `${PLAYER_PREFIX}${id}:${k === SAVE_KEY ? 'save' : k.startsWith(BACKUP_PREFIX) ? `backup:${k.slice(BACKUP_PREFIX.length)}` : k}`;
  return {
    getItem: k => storage.getItem(key(k)),
    setItem: (k,v) => storage.setItem(key(k),v),
    removeItem: k => storage.removeItem(key(k)),
  };
}

export function persistLibrary(storage: StorageLike | null, library: PlayerLibrary): boolean {
  if (!storage) return false;
  try { storage.setItem(PLAYERS_KEY,JSON.stringify(library)); return true; } catch { return false; }
}

export function createPlayer(library: PlayerLibrary, name: string, now: number): {library:PlayerLibrary;player:Player;save:SaveData} {
  const clean = name.trim().slice(0,30);
  if (!clean || library.players.length >= 24) throw new Error('בחרי שם קצר לפרופיל (עד 24 פרופילים).');
  if (library.players.some(p => p.name === clean && !p.needsOwner)) throw new Error('כבר יש פרופיל בשם הזה. אפשר לבחור בו ברשימה.');
  let id = `p-${now.toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  while (library.players.some(p => p.id === id)) id += 'x';
  const player:Player = {id,name:clean,needsOwner:false,createdAt:now};
  const save = defaultSave(now);
  save.profile.studioName = `הסטודיו של ${clean}`.slice(0,30);
  return {library:{version:1,players:[...library.players,player]},player,save};
}

export function renamePlayer(library: PlayerLibrary, id: string, name: string): PlayerLibrary {
  const clean = name.trim().slice(0,30);
  if (!clean || !library.players.some(p=>p.id===id)) throw new Error('צריך לבחור שם לפרופיל.');
  if (library.players.some(p=>p.id!==id && p.name===clean && !p.needsOwner)) throw new Error('השם כבר שייך לפרופיל אחר.');
  return {...library,players:library.players.map(p=>p.id===id?{...p,name:clean,needsOwner:false}:p)};
}

function hasExistingGame(save: SaveData): boolean {
  return save.profile.onboarded || save.coins > 0 || save.totalEarned > 0 || save.album.length > 0 ||
    Object.keys(save.learning.facts).length > 0 || !!save.learning.learnSession || save.progress.roundsCompleted > 0;
}

/** Migration is copy-first: keep the original key and backup; never infer which child owns it. */
export function bootstrapPlayers(storage:StorageLike|null, legacy:SaveData, now:number):PlayersBoot {
  let raw:string|null = null;
  try { raw = storage?.getItem(PLAYERS_KEY) ?? null; }
  catch { return {status:'corrupt',raw:'',message:'לא הצלחנו לקרוא את רשימת הפרופילים. הנתונים לא שונו.'}; }
  if (raw !== null) {
    let value:unknown;
    try { value = JSON.parse(raw); } catch { return {status:'corrupt',raw,message:'רשימת הפרופילים פגומה. השמירות המקוריות לא שונו.'}; }
    const v = value as Partial<PlayerLibrary> | null;
    if (!v || v.version!==1 || !Array.isArray(v.players) || !v.players.length || v.players.length>24 ||
      v.players.some(p=>!p || typeof p.id!=='string' || !ID_RE.test(p.id) || typeof p.name!=='string' || !p.name.trim() || p.name.length>30 ||
        typeof p.needsOwner!=='boolean' || typeof p.createdAt!=='number' || !Number.isFinite(p.createdAt)) ||
      new Set(v.players.map(p=>p.id)).size!==v.players.length) {
      return {status:'corrupt',raw,message:'רשימת הפרופילים אינה תקינה או שייכת לגרסה חדשה יותר. לא החלפנו אותה.'};
    }
    const library = v as PlayerLibrary;
    const saves:Record<string,SaveData> = {};
    const errors:Record<string,PlayerError> = {};
    for (const p of library.players) {
      const scoped = storage && playerStorage(storage,p.id);
      if (!scoped) { errors[p.id]={raw:'',errors:['השמירה אינה זמינה.'],backupKey:null};continue; }
      let result;
      try { result = loadSave(scoped,now); } catch { errors[p.id]={raw:'',errors:['לא הצלחנו לקרוא את השמירה.'],backupKey:null}; continue; }
      if (result.status==='corrupt') errors[p.id]=result;
      else if (result.status==='new') errors[p.id]={raw:'',errors:['השמירה של הפרופיל לא נמצאה. לא איפסנו אותה. אפשר לייבא גיבוי.'],backupKey:null};
      else saves[p.id]=result.data;
    }
    return {status:'ready',library,saves,errors,persistent:storage!==null};
  }
  let library:PlayerLibrary = {version:1,players:[]};
  const saves:Record<string,SaveData> = {};
  let persistent = storage!==null;
  let original:string|null=null;
  try { original=storage?.getItem(SAVE_KEY)??null; }
  catch { return {status:'corrupt',raw:'',message:'לא הצלחנו לקרוא את השמירה הישנה. הנתונים לא שונו.'}; }
  if (original!==null || hasExistingGame(legacy)) {
    const p:Player={id:'legacy',name:'השמירה הקיימת',needsOwner:true,createdAt:legacy.createdAt};
    library={version:1,players:[p]}; saves[p.id]=legacy;
    if (storage) {
      if (!backupRaw(storage,original??JSON.stringify(legacy),now)) persistent=false;
    }
  } else {
    for (const name of ['ליאורי','נועה']) {
      const added = createPlayer(library,name,now);
      library=added.library; saves[added.player.id]=added.save;
    }
  }
  if (storage) {
    for (const p of library.players) if (!writeSave(playerStorage(storage,p.id),saves[p.id])) persistent=false;
    // Register only after every save was safely copied. A quota failure keeps the old game recoverable.
    if (persistent) persistent=persistLibrary(storage,library);
  }
  return {status:'ready',library,saves,errors:{},persistent};
}
