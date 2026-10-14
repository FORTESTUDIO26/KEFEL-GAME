import { useMemo, useState } from 'react';
import { App } from './App';
import { defaultSave, repairFromRaw, type StorageLike } from './state/save';
import { StoreProvider } from './state/store';
import type { SaveData } from './state/types';
import { downloadText } from './ui/files';
import { applyRequestedDog, bootstrapPlayers, createPlayer, persistLibrary, playerStorage, PLAYERS_KEY, renamePlayer, type Player, type PlayerLibrary } from './state/profiles';
import { writeSave, parseImport } from './state/save';
import { PlayerPicker } from './screens/PlayerPicker';

export type Boot =
  | { kind: 'ready'; data: SaveData; fresh: boolean }
  | { kind: 'corrupt'; raw: string; errors: string[]; backupKey: string | null };

export function Root({ boot, storage }: { boot: Boot; storage: StorageLike | null }) {
  const [data, setData] = useState<SaveData | null>(boot.kind === 'ready' ? boot.data : null);
  const [registered] = useState(() => {
    try { return !!storage?.getItem(PLAYERS_KEY); } catch { return false; }
  });

  if (!data && boot.kind === 'corrupt' && !registered) {
    return <CorruptSave boot={boot} onChoose={setData} />;
  }
  return <PlayersRoot legacy={data ?? defaultSave(Date.now())} storage={storage}/>;
}

function PlayersRoot({legacy,storage}:{legacy:SaveData;storage:StorageLike|null}) {
  const [boot] = useState(()=>bootstrapPlayers(storage,legacy,Date.now()));
  const [library,setLibrary] = useState<PlayerLibrary>(boot.status==='ready'?boot.library:{version:1,players:[]});
  const [saves,setSaves] = useState(boot.status==='ready'?boot.saves:{});
  const [errors,setErrors] = useState(boot.status==='ready'?boot.errors:{});
  const [persistent,setPersistent] = useState(boot.status==='ready'&&boot.persistent);
  const [selected,setSelected] = useState<string|null>(null);
  const scoped = useMemo(()=>storage&&selected?playerStorage(storage,selected):null,[storage,selected]);

  if (boot.status==='corrupt') return <main className="center-page"><section className="card narrow stack" role="alert">
    <h1>צריך לבדוק את רשימת הפרופילים</h1><p>{boot.message}</p>
    <p>לא מחקנו שום פרופיל. אפשר לשמור עותק של הרשימה ולנסות לרענן את הדף.</p>
    <button className="secondary" onClick={()=>void downloadText(boot.raw,'kefel-game-players-recovery.json')}>שמירת עותק לשחזור</button>
    <button className="primary" onClick={()=>location.reload()}>לנסות שוב</button>
  </section></main>;

  const saveLibrary = (next:PlayerLibrary,nextSaves:Record<string,SaveData>) => {
    let ok=storage!==null;
    if (storage) {
      for (const p of next.players) {
        if ((!persistent || !library.players.some(old=>old.id===p.id)) && nextSaves[p.id] && !writeSave(playerStorage(storage,p.id),nextSaves[p.id])) ok=false;
      }
      if (ok) ok=persistLibrary(storage,next);
    }
    setPersistent(ok);setLibrary(next);setSaves(nextSaves);
  };
  const add = (name:string,play=false) => {
    try {
      const r=createPlayer(library,name,Date.now());
      saveLibrary(r.library,{...saves,[r.player.id]:r.save});
      if(play)setSelected(r.player.id);
      return null;
    } catch(e) { return e instanceof Error?e.message:'לא הצלחנו להוסיף פרופיל.'; }
  };
  const namePlayer = (id:string,name:string) => {
    try { saveLibrary(renamePlayer(library,id,name),{...saves,[id]:applyRequestedDog(saves[id],name,Date.now())});
      if(storage)writeSave(playerStorage(storage,id),applyRequestedDog(saves[id],name,Date.now()));
      return null; }
    catch(e) { return e instanceof Error?e.message:'לא הצלחנו לשייך את השמירה.'; }
  };
  if (!selected) return <PlayerPicker library={library} saves={saves} errors={errors} persistent={persistent} onPlay={(p:Player)=>{
    if(!persistent)saveLibrary(library,saves);
    setSelected(p.id);
  }} onAdd={add} onName={namePlayer}/>;
  const player=library.players.find(p=>p.id===selected)!;
  const back = () => setSelected(null);
  const err=errors[selected];
  if (err) return <>
    <div className="row center" style={{padding:12}}><button className="secondary" onClick={back}>חזרה לבחירת פרופיל</button></div>
    <CorruptSave boot={{kind:'corrupt',...err}} onChoose={data=>{
      const nextErrors={...errors};delete nextErrors[selected];setErrors(nextErrors);
      setSaves({...saves,[selected]:data});
      if (scoped) writeSave(scoped,data);
    }}/>
  </>;
  return <StoreProvider key={selected} initial={saves[selected]} storage={scoped} libraryPersistent={persistent}>
    <App playerName={player.name} onSwitchPlayer={(save)=>{
      setSaves(prev=>({...prev,[selected]:save}));setSelected(null);
    }}/>
  </StoreProvider>;
}

function CorruptSave({ boot, onChoose }: { boot: Extract<Boot, { kind: 'corrupt' }>; onChoose: (s: SaveData) => void }) {
  const [confirmNew, setConfirmNew] = useState(false);
  const [importError,setImportError] = useState('');
  // Only offer a repair when the stored text is readable at all and actually holds progress.
  const [salvage] = useState<SaveData | null>(() => {
    try {
      JSON.parse(boot.raw);
    } catch {
      return null;
    }
    const s = repairFromRaw(boot.raw, Date.now());
    const hasProgress = s.profile.onboarded || s.coins > 0 || s.album.length > 0 || Object.keys(s.learning.facts).length > 0;
    return hasProgress ? s : null;
  });
  return (
    <div className="center-page">
      <div className="card narrow stack">
        <h1>משהו בשמירה השתבש</h1>
        <p>לא הצלחנו לקרוא את כל ההתקדמות שנשמרה בדפדפן הזה.</p>
        <ul className="muted">
          {boot.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p>
          {boot.backupKey
            ? 'שמרנו עותק של השמירה הפגומה בדפדפן, כך ששום דבר לא נמחק.'
            : 'לא הצלחנו לשמור עותק נוסף בדפדפן — מומלץ להוריד עותק לפני שממשיכים.'}
        </p>
        {salvage ? (
          <>
            <p>
              אפשר לשחזר: סטודיו ״{salvage.profile.studioName}״, <bdi dir="ltr">{salvage.coins}</bdi> מטבעות,{' '}
              <bdi dir="ltr">{salvage.album.length}</bdi> תמונות ו־<bdi dir="ltr">{Object.keys(salvage.learning.facts).length}</bdi> תרגילים עם נתונים.
            </p>
            <button className="primary big" onClick={() => onChoose(salvage)}>
              לשחזר את מה שאפשר ולהמשיך
            </button>
          </>
        ) : (
          <p className="warn-box">
            את הקובץ הזה לא ניתן לשחזר. אם יש לכם קובץ גיבוי שיוצא בעבר, אפשר להתחיל מחדש ואז לייבא אותו ב״ההתקדמות של ליאורי״ ← ״שמירה וגיבוי״.
          </p>
        )}
        <button className="secondary" onClick={() => downloadText(boot.raw, 'liori-studio-damaged-save.json')}>
          להוריד עותק של השמירה הפגומה
        </button>
        <label className="field"><span>או לייבא קובץ גיבוי של הפרופיל</span><input type="file" accept=".json,application/json" onChange={async e=>{
          const file=e.target.files?.[0];e.target.value='';if(!file)return;
          try { const r=parseImport(await file.text(),Date.now());if(r.ok)onChoose(r.data);else setImportError(r.errors.join(' ')); }
          catch { setImportError('לא הצלחנו לקרוא את הקובץ. השמירה לא שונתה.'); }
        }}/></label>
        {importError&&<p className="warn-box" role="alert">{importError}</p>}
        {!confirmNew ? (
          <button className="ghost" onClick={() => setConfirmNew(true)}>
            להתחיל סטודיו חדש
          </button>
        ) : (
          <div className="warn-box stack">
            <p>להתחיל מחדש? ההתקדמות הפגומה לא תוצג במשחק{boot.backupKey ? ' (העותק נשאר שמור בדפדפן)' : ''}.</p>
            <div className="row">
              <button className="danger" onClick={() => onChoose(defaultSave(Date.now()))}>
                כן, להתחיל מחדש
              </button>
              <button className="ghost" onClick={() => setConfirmNew(false)}>
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
