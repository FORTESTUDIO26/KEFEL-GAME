import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../App';
import { DogFigure } from '../art/Dog';
import { DOGS } from '../content/dogs';
import { SLOT_LABEL, SLOT_ORDER, WEARABLES } from '../content/catalog';
import { useStore } from '../state/store';
import { toggleItem } from '../state/game';
import type { RoomId, SaveData } from '../state/types';
import { advanceBirthday, BIRTHDAY_THEMES, birthdayTheme, birthdayVisit, finishBirthday, pauseBirthday, prepareBirthdayKitchen, restartBirthday, startBirthday, syncBirthday } from '../state/birthday';
import './BirthdayStory.css';
import { CompletionBurst } from './MissionCelebration';

const lola=DOGS.find(d=>d.id==='lola')!;
const titles={invite:'מזמינות את לולה',kitchen:'עורכות שולחן חגיגי',outfit:'מלבישות את לולה',learn:'לומדות לקראת המסיבה',party:'חוגגות בחצר',done:'מזכרת מיום ההולדת'};
export function BirthdayStory({onGo}:{onGo:(screen:Screen)=>void}) {
  const {save,update}=useStore();
  const b=save.birthday;
  const [open,setOpen]=useState(b.active&&b.stage==='party');
  const root=useRef<HTMLDetailsElement>(null);
  const previous=useRef({stage:b.stage,photoId:b.photoId});
  const [burst,setBurst]=useState<string|null>(null);
  useEffect(()=>{
    if(b.active&&previous.current.stage==='learn'&&b.stage==='party')setOpen(true);
    if(b.stage==='done'&&b.photoId&&b.photoId!==previous.current.photoId)setBurst(b.photoId);
    previous.current={stage:b.stage,photoId:b.photoId};
  },[b.stage,b.active,b.photoId]);
  useEffect(()=>{
    if(!open)return;
    const el=root.current;if(!el)return;
    const scope=el.closest('.design-workspace')??document;
    scope.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu=>{if(menu!==el&&!menu.contains(el))menu.open=false;});
    const outside=(e:Event)=>{if(e.target instanceof Node&&!el.contains(e.target))setOpen(false);};
    const toggled=(e:Event)=>{if(e.target instanceof HTMLDetailsElement&&e.target!==el&&e.target.open&&!el.contains(e.target))setOpen(false);};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);el.querySelector('summary')?.focus();}};
    document.addEventListener('pointerdown',outside,true);
    document.addEventListener('click',outside,true);
    document.addEventListener('toggle',toggled,true);
    document.addEventListener('keydown',key,true);
    return ()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('click',outside,true);document.removeEventListener('toggle',toggled,true);document.removeEventListener('keydown',key,true);};
  },[open]);
  useEffect(()=>{update(syncBirthday);},[save.learning.daily,save.rewards.claimed,update]);
  const visit=(room:RoomId)=>{update(s=>birthdayVisit(s.birthday,room)?{...s,world:{...s.world,activeRoom:room}}:s);onGo('studio');setOpen(false);};
  const act=(fn:(s:SaveData)=>SaveData)=>update(fn);
  return <>{burst&&<CompletionBurst key={burst} reduced={save.settings.reduceMotion}/>}<details ref={root} className="birthday-story" open={open} onToggle={e=>setOpen(e.currentTarget.open)} dir="rtl">
    <summary aria-label="יום הולדת"><BirthdayCakeIcon/><span>יום הולדת</span></summary>
    <section className="birthday-story-panel" aria-label="סיפור יום ההולדת של לולה">
      <button className="birthday-close" aria-label="סגירת סיפור יום ההולדת" onClick={()=>setOpen(false)}>×</button>
      <h2>{titles[b.stage]}</h2>
      <p>יום הולדת ללולה · שלב {['invite','kitchen','outfit','learn','party','done'].indexOf(b.stage)+1} מתוך 6</p>
      {!b.active&&b.stage!=='done'?<><p>{b.stage==='invite'?'נכין ללולה מסיבה עם חברות, עוגה ובלונים. כל מה שצריך כבר כאן!':'הסיפור מחכה בדיוק במקום שבו עצרת.'}</p><button onClick={()=>act(startBirthday)}>{b.stage==='invite'?'מתחילות יום הולדת':'ממשיכות את הסיפור'}</button></>:null}
      {b.active&&b.stage==='invite'&&<><DogFigure dog={lola} outfit={save.outfits.lola??{}} className="birthday-dog"/><p>לולה מוזמנת! בחרי צבע למסיבה:</p><ThemeChoices value={b.theme} choose={color=>act(s=>birthdayTheme(s,color))}/><button onClick={()=>act(advanceBirthday)}>מזמינות את לולה ומכינות שולחן</button></>}
      {b.active&&b.stage==='kitchen'&&<><p>השולחן, הצלחות והספלים חינם. אפשר להזיז ולעצב אותם במטבח.</p><ThemeChoices value={b.theme} choose={color=>act(s=>birthdayTheme(s,color))}/><button onClick={()=>act(prepareBirthdayKitchen)}>מסדרות שולחן, צלחות וספלים</button><button onClick={()=>visit('kitchen')}>למטבח</button><button disabled={!['kitchen_table','kitchen_plates','kitchen_cups'].every(id=>save.world.rooms.kitchen.items.some(p=>p.itemId===id))} onClick={()=>act(advanceBirthday)}>השולחן מוכן · לבגדים</button></>}
      {b.active&&b.stage==='outfit'&&<><p>בוחרות מהארון של לולה, בלי לקנות. אפשר גם להמשיך עם הלוק שלה.</p><DogFigure dog={lola} outfit={save.outfits.lola??{}} className="birthday-dog"/>
        <div className="birthday-wardrobe">{SLOT_ORDER.map(slot=><fieldset key={slot}><legend>{SLOT_LABEL[slot]}</legend>{WEARABLES.filter(w=>w.slot===slot&&save.owned.wearables.includes(w.id)).map(w=><button key={w.id} aria-pressed={save.outfits.lola?.[slot]?.itemId===w.id} onClick={()=>act(s=>s.birthday.active&&s.birthday.stage==='outfit'&&s.owned.wearables.includes(w.id)?{...s,outfits:{...s.outfits,lola:toggleItem(s.outfits.lola??{},w.id)}}:s)}>{w.name}</button>)}{!WEARABLES.some(w=>w.slot===slot&&save.owned.wearables.includes(w.id))&&<span>בלי אביזר</span>}</fieldset>)}</div><button onClick={()=>act(advanceBirthday)}>הלוק מוכן · לומדות שש עובדות</button></>}
      {b.active&&b.stage==='learn'&&<><p>נלמד שש עובדות במסלול ״לומדות וזוכרות״. קודם לומדות ואז מנסות לזכור; גם עם עזרה אפשר להגיע למסיבה.</p><p>בסיום לחצי על החזרה לסטודיו — הסיפור ייפתח כאן ונמשיך למסיבה.</p><button onClick={()=>{onGo('learn');setOpen(false);}}>לומדות לקראת המסיבה</button></>}
      {b.active&&b.stage==='party'&&<><p role="status">הלמידה הושלמה — ממשיכות את סיפור יום ההולדת!</p><p>החברות, העוגה והבלונים מחכים בחצר. נצלם את לולה בלוק שבחרת ונשמור באלבום!</p><button onClick={()=>visit('garden')}>לחגיגה בחצר</button><button disabled={save.world.activeRoom!=='garden'} onClick={()=>act(s=>finishBirthday(s,Date.now()))}>מצלמות מזכרת לאלבום 📷</button></>}
      {b.stage==='done'&&<><p>יום הולדת שמח, לולה! התמונה נשמרה באלבום.{b.completedAt?` ${new Date(b.completedAt).toLocaleDateString('he-IL')}`:''}</p><button onClick={()=>{onGo('album');setOpen(false);}}>לתמונת יום ההולדת באלבום</button><button onClick={()=>act(restartBirthday)}>יום הולדת חדש</button><p>התמונות מימי ההולדת הקודמים נשארות באלבום.</p></>}
      {b.active&&<button className="birthday-pause" onClick={()=>act(pauseBirthday)}>לעצור את הסיפור</button>}
    </section>
  </details></>;
}
function BirthdayCakeIcon(){
  return <svg className="birthday-cake-icon" viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true" focusable="false"><path d="M5 28h22M7 27V15h18v12" fill="#f6a8cc" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 19q3 5 6 0 3 5 6 0 3 5 6 0" stroke="#fffaf5" strokeWidth="3"/><path d="M11 14V9m10 5V9m-5 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M11 3q-4 5 0 5t0-5M21 3q-4 5 0 5t0-5M16 1q-4 5 0 5t0-5" fill="#edaf46"/></svg>;
}
function ThemeChoices({value,choose}:{value:string;choose:(color:string)=>void}) {
  return <div className="birthday-colors" role="group" aria-label="צבע המסיבה">{BIRTHDAY_THEMES.map((color,i)=><button key={color} aria-pressed={value===color} style={{background:color}} onClick={()=>choose(color)}>{['ורוד','סגול','מנטה'][i]}</button>)}</div>;
}
/** SVG group: mount inside the world's SVG, under StoreProvider. */
export function BirthdayScenery() {
  const {save}=useStore();const b=save.birthday;
  if(!b.active||b.stage!=='party'||save.world.activeRoom!=='garden')return null;
  return <g className="birthday-scenery" pointerEvents="none" role="img" aria-label="מסיבת יום הולדת ללולה עם חברות, עוגה ובלונים">
    {[140,700,800].map((x,i)=><g key={x}><path d={`M${x} 220 Q${x-20} 285 ${x} 355`} stroke="#826c91" fill="none"/><ellipse cx={x} cy={190-i*10} rx="27" ry="37" fill={BIRTHDAY_THEMES[i]}/></g>)}
    <path d="M100 100 Q450 190 850 100" stroke={b.theme} strokeWidth="4" fill="none"/>
    {[180,280,380,480,580,680,780].map((x,i)=><path key={x} d={`M${x} 120 l28 5 -14 32Z`} fill={BIRTHDAY_THEMES[i%3]}/>)}
    {DOGS.filter(d=>d.id!=='lola').slice(0,2).map((dog,i)=><g key={dog.id} transform={`translate(${180+i*470} 300) scale(.52)`}><DogFigure dog={dog} outfit={save.outfits[dog.id]??{}} asGroup/></g>)}
    <g transform="translate(470 270) scale(.56)"><DogFigure dog={lola} outfit={save.outfits.lola??{}} asGroup/></g>
    <g transform="translate(410 315)"><rect x="-15" y="65" width="180" height="15" rx="8" fill="#fff5ef"/><rect width="150" height="70" rx="14" fill={b.theme} stroke="#775361" strokeWidth="3"/><path d="M0 20 Q15 40 30 20 Q45 40 60 20 Q75 40 90 20 Q105 40 120 20 Q135 40 150 20" fill="none" stroke="#fff5ef" strokeWidth="10"/>{[35,75,115].map(x=><g key={x}><path d={`M${x} 0 v-25`} stroke="#fff" strokeWidth="7"/><ellipse cx={x} cy="-32" rx="5" ry="9" fill="#ffc65a"/></g>)}</g>
  </g>;
}
