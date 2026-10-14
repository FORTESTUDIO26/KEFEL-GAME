import { useState } from 'react';
import { DogFigure } from '../art/Dog';
import { dogById } from '../content/dogs';
import type { Player, PlayerError, PlayerLibrary } from '../state/profiles';
import type { SaveData } from '../state/types';
import { Icon } from '../ui/icons';
import { Modal } from '../ui/common';
import '../profiles.css';

interface Props {
  library:PlayerLibrary;
  saves:Record<string,SaveData>;
  errors:Record<string,PlayerError>;
  persistent:boolean;
  onPlay:(p:Player)=>void;
  onAdd:(name:string)=>string|null;
  onName:(id:string,name:string)=>string|null;
}

export function PlayerPicker({library,saves,errors,persistent,onPlay,onAdd,onName}:Props) {
  const [form,setForm] = useState<{id?:string;name:string}|null>(null);
  const [error,setError] = useState('');
  const showForm = (id?:string) => { setError('');setForm({id,name:''}); };
  const submit = () => {
    if (!form) return;
    const message = form.id ? onName(form.id,form.name) : onAdd(form.name);
    if (message) { setError(message);return; }
    setForm(null);
  };
  return <main className="players-page" dir="rtl">
    <header className="players-intro">
      <span className="players-brand"><Icon name="paw" size={28}/> KEFEL GAME</span>
      <p className="eyebrow">כל אחת והסטודיו שלה</p>
      <h1>מי משחקת היום?</h1>
      <p className="muted">בחרי את הפרופיל שלך. הלמידה, המטבעות, הבגדים והאלבום נשמרים בנפרד.</p>
    </header>
    {!persistent && <p className="warn-box" role="alert">השמירה במכשיר אינה זמינה כרגע. אפשר לשחק זמנית; לפני סגירה כדאי לייצא גיבוי מתוך אזור ההורים.</p>}
    <section className="player-grid" aria-label="בחירת פרופיל">
      {library.players.map(p=>{
        const save = saves[p.id];
        return <article className={`player-card card ${p.needsOwner?'unclaimed':''}`} key={p.id}>
          <DogFigure dog={dogById(save?.profile.ownDogId ?? 'kakao')} outfit={save?.outfits[save.profile.ownDogId]}/>
          <h2>{p.name}</h2>
          <p className="muted small">{p.needsOwner ? `הסטודיו ״${save?.profile.studioName ?? ''}״ וההתקדמות הישנה נשמרו. בחרי למי הם שייכים.` : save?.profile.studioName}</p>
          {errors[p.id] ? <p className="warn-box small">צריך לשחזר את השמירה של הפרופיל. הפרופילים האחרים לא נפגעו.</p> : save?.profile.onboarded ? <p className="player-details">{save.coins} מטבעות · {save.album.length} תמונות</p> : <p className="tag">סטודיו חדש — כל הפריטים החינמיים מחכים לך</p>}
          <button className="primary big" onClick={()=>p.needsOwner?showForm(p.id):onPlay(p)}>{p.needsOwner?'למי שייכת השמירה?':errors[p.id]?'פתיחת שחזור':'זה הפרופיל שלי'}</button>
        </article>;
      })}
      <button className="player-add card" onClick={()=>showForm()} aria-label="הוספת פרופיל חדש"><Icon name="plus" size={36}/><strong>שחקנית נוספת</strong><span className="muted small">סטודיו והתקדמות חדשים, רק שלה</span></button>
    </section>
    <p className="players-note muted small">הפרופילים נשמרים בדפדפן ובמכשיר הזה. הם לא מסתנכרנים בין מכשירים. אפשר לעבור פרופיל בכל זמן דרך ״מי משחקת?״.</p>
    {form && <Modal title={form.id?'למי שייכת ההתקדמות הקיימת?':'פרופיל חדש'} onClose={()=>setForm(null)}>
      <div className="stack">
        {form.id && <p>רק נשייך את השמירה לשם שתבחרי. הסטודיו, הרכישות וההתקדמות יישארו כפי שהם.</p>}
        <label className="field"><span>שם השחקנית</span><input autoFocus value={form.name} maxLength={30} onChange={e=>setForm({...form,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&form.name.trim()&&submit()}/></label>
        <div className="chips">{['ליאורי','נועה'].map(n=><button className={`chip ${form.name===n?'on':''}`} key={n} onClick={()=>setForm({...form,name:n})}>{n}</button>)}</div>
        {error && <p role="alert" className="warn-box">{error}</p>}
        <button className="primary big" disabled={!form.name.trim()} onClick={submit}>{form.id?'לשייך את השמירה':'ליצור פרופיל'}</button>
      </div>
    </Modal>}
  </main>;
}
