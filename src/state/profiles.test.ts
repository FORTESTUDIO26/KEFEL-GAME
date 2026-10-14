import { describe, expect, it } from 'vitest';
import { BACKUP_PREFIX, defaultSave, exportText, loadSave, parseImport, SAVE_KEY, writeSave, type StorageLike } from './save';
import { bootstrapPlayers, createPlayer, persistLibrary, playerStorage, PLAYERS_KEY, renamePlayer, applyRequestedDog } from './profiles';
import { applyOutcome } from '../learning/data';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}
const now = new Date(2026, 9, 14, 12).getTime();

describe('independent player saves', () => {
  it('swaps dogs once for existing named profiles without changing progress or earlier outfits',()=>{
    const old=defaultSave(now);old.coins=71;old.profile.ownDogId='bosko';old.outfits.bosko={body:{itemId:'hoodie',color:'#2ec4c0'}};
    const changed=applyRequestedDog(old,'ליאורי',now+1);
    expect(changed.profile.ownDogId).toBe('kakao');expect(changed.coins).toBe(71);expect(changed.outfits.bosko).toEqual(old.outfits.bosko);
    const userChoice={...changed,profile:{...changed.profile,ownDogId:'mika'}};
    expect(applyRequestedDog(userChoice,'ליאורי',now+2)).toBe(userChoice);
    expect(applyRequestedDog(old,'השמירה הקיימת',now+2)).toBe(old);
  });
  it('starts with distinct Liori and Noa players and saves', () => {
    const storage = new MemoryStorage();
    const result = bootstrapPlayers(storage, defaultSave(now), now);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.library.players.map(p => p.name)).toEqual(['ליאורי', 'נועה']);
    expect(result.library.players[0].id).not.toBe(result.library.players[1].id);
    expect(result.library.players.every(p => result.saves[p.id].coins === 0)).toBe(true);
    expect(result.saves[result.library.players[1].id].profile.studioName).toBe('הסטודיו של נועה');
    expect(result.saves[result.library.players[0].id].profile.ownDogId).toBe('kakao');
    expect(result.saves[result.library.players[1].id].profile.ownDogId).toBe('bosko');
  });

  it('backs up and migrates existing progress without guessing its owner or changing the old save', () => {
    const storage = new MemoryStorage();
    const old = defaultSave(now);
    old.profile.onboarded = true;
    old.coins = 123;
    old.owned.wearables.push('beret');
    old.album.push({id:'photo', dogId:'kakao',outfit:{},backdrop:'studio',title:'לוק',requestId:null,directionId:null,stars:0,createdAt:now});
    old.learning.learnSession = null;
    const raw = JSON.stringify(old);
    storage.setItem(SAVE_KEY, raw);
    const first = bootstrapPlayers(storage, old, now);
    expect(first.status).toBe('ready');
    if (first.status !== 'ready') return;
    const legacy = first.library.players.find(p => p.needsOwner);
    expect(legacy).toBeDefined();
    expect(first.saves[legacy!.id]).toEqual(old);
    expect(storage.getItem(SAVE_KEY)).toBe(raw);
    expect([...storage.data.keys()].some(k => k.startsWith(BACKUP_PREFIX))).toBe(true);
    expect(persistLibrary(storage, first.library)).toBe(true);
    const second = bootstrapPlayers(storage, old, now + 100);
    expect(second.status).toBe('ready');
    if (second.status === 'ready') expect(second.library.players).toEqual(first.library.players);
  });
  it('preserves an existing save even before onboarding or practice, including settings and room choices',()=>{
    const storage=new MemoryStorage();const old=defaultSave(now);
    old.settings.sound=false;old.settings.tables=[7,8];old.studio.wall='wall_solid';
    const raw=JSON.stringify(old);storage.setItem(SAVE_KEY,raw);
    const r=bootstrapPlayers(storage,old,now);
    expect(r.status).toBe('ready');
    if(r.status==='ready') {
      expect(r.library.players[0].needsOwner).toBe(true);
      expect(r.saves[r.library.players[0].id]).toEqual(old);
    }
    expect(storage.getItem(SAVE_KEY)).toBe(raw);
  });

  it('keeps coins, ownership, album and learning isolated across writes and reloads', () => {
    const storage = new MemoryStorage();
    const r = bootstrapPlayers(storage, defaultSave(now), now);
    if (r.status !== 'ready') throw new Error('bootstrap failed');
    persistLibrary(storage, r.library);
    const [liori, noa] = r.library.players;
    const l = {...r.saves[liori.id],coins:71, owned:{...r.saves[liori.id].owned,wearables:[...r.saves[liori.id].owned.wearables,'beret']},
      learning:applyOutcome(r.saves[liori.id].learning,{a:7,b:8,outcome:'independent',usedHint:false},now),
      album:[{id:'look',dogId:'kakao',outfit:{},backdrop:'studio' as const,title:'ליאורי',requestId:null,directionId:null,stars:0,createdAt:now}]};
    writeSave(playerStorage(storage, liori.id), l);
    writeSave(playerStorage(storage, noa.id), {...r.saves[noa.id],coins:22});
    expect(loadSave(playerStorage(storage, liori.id), now).status).toBe('ok');
    const reload = bootstrapPlayers(storage, defaultSave(now), now + 100);
    if (reload.status !== 'ready') throw new Error('reload failed');
    expect(reload.saves[liori.id].coins).toBe(71);
    expect(reload.saves[noa.id].coins).toBe(22);
    expect(reload.saves[noa.id].owned.wearables).not.toContain('beret');
    expect(reload.saves[liori.id].album).toHaveLength(1);
    expect(reload.saves[noa.id].album).toHaveLength(0);
    expect(reload.saves[liori.id].learning.facts['7x8'].independentCorrect).toBe(1);
    expect(reload.saves[noa.id].learning.facts['7x8']).toBeUndefined();
  });

  it('scopes backups, import and reset to only the selected player', () => {
    const storage = new MemoryStorage();
    const liori = playerStorage(storage, 'liori');
    const noa = playerStorage(storage, 'noa');
    const a = {...defaultSave(now),coins:88};
    const b = {...defaultSave(now),coins:12};
    writeSave(liori,a); writeSave(noa,b);
    liori.setItem(`${BACKUP_PREFIX}${now}`, JSON.stringify(a));
    noa.setItem(`${BACKUP_PREFIX}${now}`, JSON.stringify(b));
    expect(liori.getItem(`${BACKUP_PREFIX}${now}`)).not.toBe(noa.getItem(`${BACKUP_PREFIX}${now}`));
    const imported = parseImport(exportText({...a,coins:200},now),now);
    if (!imported.ok) throw new Error('import invalid');
    writeSave(noa,imported.data);
    liori.removeItem(SAVE_KEY); writeSave(liori,defaultSave(now));
    expect(JSON.parse(noa.getItem(SAVE_KEY)!).coins).toBe(200);
    expect(JSON.parse(liori.getItem(SAVE_KEY)!).coins).toBe(0);
    expect(liori.getItem(`${BACKUP_PREFIX}${now}`)).not.toBeNull();
  });

  it('retains malformed or future-version registry and reports it instead of replacing it', () => {
    for (const raw of ['broken', JSON.stringify({version:99,players:[]}), JSON.stringify({version:1,players:[{id:'../x',name:'נועה'}]})]) {
      const storage = new MemoryStorage(); storage.setItem(PLAYERS_KEY,raw);
      const result = bootstrapPlayers(storage,defaultSave(now),now);
      expect(result.status).toBe('corrupt');
      expect(storage.getItem(PLAYERS_KEY)).toBe(raw);
    }
  });

  it('reports a missing registered player save rather than silently resetting it', () => {
    const storage = new MemoryStorage();
    storage.setItem(PLAYERS_KEY,JSON.stringify({version:1,players:[{id:'known',name:'נועה',needsOwner:false,createdAt:now}]}));
    const result = bootstrapPlayers(storage,defaultSave(now),now);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.errors.known).toBeDefined();
  });

  it('creates another player without altering any existing save, and naming a legacy save changes only metadata', () => {
    const storage = new MemoryStorage();
    const r = bootstrapPlayers(storage,{...defaultSave(now),coins:5},now);
    if (r.status !== 'ready') throw new Error('bootstrap');
    const previous = JSON.stringify(r.saves);
    const named = renamePlayer(r.library,r.library.players[0].id,'נועה');
    expect(named.players[0].name).toBe('נועה');
    expect(named.players[0].needsOwner).toBe(false);
    expect(JSON.stringify(r.saves)).toBe(previous);
    const added = createPlayer(named,'אור',now+1);
    expect(added.library.players).toHaveLength(named.players.length+1);
    expect(added.save.coins).toBe(0);
    expect(added.save.profile.studioName).toBe('הסטודיו של אור');
  });

  it('allows temporary profiles when storage fails and never erases the legacy original', () => {
    const storage = new MemoryStorage(); const old = {...defaultSave(now),coins:31};
    storage.setItem(SAVE_KEY,JSON.stringify(old));
    storage.setItem = () => { throw new Error('quota'); };
    const r = bootstrapPlayers(storage,old,now);
    expect(r.status).toBe('ready');
    if (r.status === 'ready') { expect(r.persistent).toBe(false); expect(r.saves[r.library.players[0].id].coins).toBe(31); }
    expect(storage.getItem(SAVE_KEY)).toBe(JSON.stringify(old));
  });
});
