import { useState } from 'react';
import { App } from './App';
import { defaultSave, repairFromRaw, type StorageLike } from './state/save';
import { StoreProvider } from './state/store';
import type { SaveData } from './state/types';
import { downloadText } from './ui/files';

export type Boot =
  | { kind: 'ready'; data: SaveData; fresh: boolean }
  | { kind: 'corrupt'; raw: string; errors: string[]; backupKey: string | null };

export function Root({ boot, storage }: { boot: Boot; storage: StorageLike | null }) {
  const [data, setData] = useState<SaveData | null>(boot.kind === 'ready' ? boot.data : null);

  if (!data && boot.kind === 'corrupt') {
    return <CorruptSave boot={boot} onChoose={setData} />;
  }
  return (
    <StoreProvider initial={data!} storage={storage}>
      <App />
    </StoreProvider>
  );
}

function CorruptSave({ boot, onChoose }: { boot: Extract<Boot, { kind: 'corrupt' }>; onChoose: (s: SaveData) => void }) {
  const [confirmNew, setConfirmNew] = useState(false);
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
