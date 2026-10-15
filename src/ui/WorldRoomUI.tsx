import { useState,useRef,useEffect } from 'react';
import { RoomThumbnail } from '../art/WorldRooms';
import { paletteById } from '../content/catalog';
import { parseKey } from '../learning/facts';
import { buildHints } from '../learning/hints';
import { RichText } from './common';
import type { Screen } from '../App';
import { useStore } from '../state/store';
import { ROOMS, roomReadiness, switchRoom, startOpening, exposeOpening, answerOpening, closeOpening, roomActivity, editRoom } from '../state/world';
import { moveDog,recordAnswer } from '../state/game';
import './WorldRoomUI.css';
import {CompletionBurst} from './MissionCelebration';
import { Icon } from './icons';

import type { RoomId } from '../state/types';
import { birthdayVisit } from '../state/birthday';
export function WorldGameMenu({onGo}:{onGo:(screen:Screen)=>void}) {
 const {persistent}=useStore();
 const actions: {id:Screen;name:string}[]=[{id:'learn',name:'לומדות וזוכרות'},{id:'client',name:'לקוחות'},{id:'shop',name:'חנות'},{id:'wardrobe',name:'בגדים'},{id:'album',name:'אלבום'},{id:'parent',name:'להורים'},{id:'profiles',name:'מי משחקת?'}];
 return <nav className="world-game-nav" aria-label="ניווט במשחק"><details className="world-actions"><summary className="hud-button" aria-label="פעילויות"><Icon name="menu" size={28}/><span>פעילויות</span></summary><div>{actions.map(a=><button key={a.id} className="secondary small" onClick={()=>onGo(a.id)}>{a.name}</button>)}</div></details>{!persistent&&<p className="play-save-warning" role="alert">השמירה אינה זמינה כרגע. אפשר להמשיך זמנית ולייצא גיבוי דרך פעילויות ← להורים.</p>}</nav>;
}
export function RoomNavigation({ onSwitch }: { onSwitch: () => void }) {
  const { save, update } = useStore();
  return <details className="world-room-map"><summary className="hud-button" aria-label="בחירת חדר"><Icon name="home" size={28}/><span>חדרים</span></summary><nav className="world-room-tabs" aria-label="חדרי העולם">
    {ROOMS.map(room => {
      const unlocked = save.world.unlocked.includes(room.id);
      const storyVisit = !unlocked && birthdayVisit(save.birthday, room.id);
      const readiness = roomReadiness(save, room.id);
      return <button key={room.id} className={`world-room-tab ${save.world.activeRoom === room.id ? 'on' : ''}`} aria-current={save.world.activeRoom === room.id ? 'page' : undefined} aria-label={`${room.name}${unlocked ? '' : storyVisit ? ', ביקור בסיפור' : readiness.ready ? ', אפשר לפתוח' : ', נעול'}`} onClick={(event) => {
        if (unlocked || storyVisit) { onSwitch(); update(s => switchRoom(s, room.id)); }
        else if (readiness.ready) update(s => startOpening(s, room.id));
        if(unlocked||storyVisit||readiness.ready){const menu=event.currentTarget.closest('details');if(menu)menu.open=false;}
      }} aria-disabled={!unlocked && !storyVisit && !readiness.ready}>
        <RoomThumbnail id={room.id} p={paletteById(save.profile.paletteId)} />
        <strong>{room.name}</strong>
        {!unlocked && <span className="room-readiness">{storyVisit ? 'ביקור בסיפור' : readiness.ready ? '✨ אתגר פתיחה: 10 שאלות' : `🔒 עוד ${readiness.needed - readiness.learned} עובדות ללמוד (${readiness.learned}/${readiness.needed})`}</span>}
      </button>;
    })}
  </nav></details>;
}
export function RoomActivities({roomId,onGo}:{roomId:RoomId;onGo:(screen:Screen)=>void}){
 if(roomId==='studio')return null;
 return <details className="room-action-tray"><summary className="hud-button" aria-label="משחקון החדר"><Icon name="sparkle"/><span>משחקון</span></summary><RoomActivitiesContent roomId={roomId} onGo={onGo}/></details>;
}
function RoomActivitiesContent({ roomId, onGo }: { roomId: RoomId; onGo: (screen: Screen) => void }) {
  const { save, update } = useStore();
  const [gardenAction, setGardenAction] = useState('');
  if (roomId === 'studio') return null;
  if (roomId === 'dressing') return <div className="room-activity"><span>מראות, בגדים ומראה חדש לכלב שלך</span><button className="primary" onClick={() => onGo('wardrobe')}>לארון הבגדים</button></div>;
  if (roomId === 'garden') return <div className="room-activity"><div><strong>זמן יחד בגן</strong><span role="status">{gardenAction || 'משחק ואוכל לכלב'} · {save.world.activities.garden} פעילויות</span></div>{['לשחק בכדור', 'להאכיל'].map((label, index) => <button key={label} className="secondary" onClick={() => {
    setGardenAction(index === 0 ? 'הכלב רץ אל הכדור!' : 'הכלב נהנה מהאוכל!');
    update(s => editRoom(roomActivity(s, 'garden'), 'garden', draft => moveDog(draft, index === 0 ? 520 : 280, 420)));
  }}>{label}</button>)}</div>;
  if(roomId==='cafe'||roomId==='craft'){
   const cafe=roomId==='cafe';const count=save.world.activities[roomId];
   const choices=cafe?['להגיש עוגיית כלבים','להכין קערת מים']:['לצייר כרטיס צבעוני','לקשור סרט למתנה'];
   return <div className="room-activity"><div><strong>{cafe?'קפה כלבלב':'יוצרות יחד'}</strong><span role="status">{gardenAction||'רגע קטן של כיף'} · {count} יצירות</span></div>{choices.map((label,i)=><button key={label} className="secondary" onClick={()=>{setGardenAction(cafe?(i===0?'עוגייה לכלב, באהבה!':'קערת מים טריים מוכנה!'):(i===0?'כרטיס חדש לכלב החמוד!':'מתנה עם סרט צבעוני מוכנה!'));update(s=>roomActivity(s,roomId));}}>{label}</button>)}</div>;
  }
  if(roomId==='kitchen'||roomId==='bathroom'){
   const kitchen=roomId==='kitchen';const count=save.world.activities[roomId];
   const choices=kitchen?['לבשל מרק לכלבים','לערוך את השולחן']:['אמבטיית בועות','לייבש במגבת'];
   return <div className="room-activity"><div><strong>{kitchen?'מבשלות באהבה':'זמן בועות'}</strong><span role="status">{gardenAction||'בחרי פעילות לכלב'} · {count} פעילויות</span></div>{choices.map((label,i)=><button key={label} className="secondary" onClick={()=>{setGardenAction(kitchen?(i===0?'המרק מוכן! איזה ריח טוב.':'השולחן ערוך לארוחה משותפת!'):(i===0?'בועות, בועות! הכלב נקי ושמח.':'איזה כלב רך ונעים!'));update(s=>roomActivity(s,roomId));}}>{label}</button>)}</div>;
  }
  const count = save.world.activities.stage;
  const step = count % 3;
  const labels = ['סיבוב בחישוק', 'גלגול כדור', 'ריקוד בסרט'];
  return <div className="room-activity"><div><strong>תרגיל במה בשלושה צעדים</strong><span role="status">{Math.floor(count / 3)} מופעים הושלמו · צעד {step + 1} מתוך 3</span></div><ol className="stage-steps">{labels.map((label, i) => <li key={label} className={i === step ? 'on' : i < step ? 'done' : ''}><span aria-hidden="true">{['◯', '●', '〰'][i]}</span>{label}</li>)}</ol><button className="primary" onClick={() => update(s => roomActivity(s, 'stage'))}>{labels[step]}</button></div>;
}
export function RoomOpening({ onGo }: { onGo?: (screen: Screen) => void } = {}) {
  const { save } = useStore();
  const opening = save.world.opening;
  const previous=useRef(save.world.unlocked.length),[burst,setBurst]=useState(0);
  useEffect(()=>{if(save.world.unlocked.length>previous.current)setBurst(n=>n+1);previous.current=save.world.unlocked.length;},[save.world.unlocked.length]);
  return <>{burst>0&&<CompletionBurst key={burst} reduced={save.settings.reduceMotion}/>}{opening&&<OpeningQuestion key={`${opening.roomId}-${opening.index}-${opening.finished}`} onGo={onGo} />}</>;
}
function OpeningQuestion({ onGo }: { onGo?: (screen: Screen) => void }) {
  const { save, update } = useStore();
  const opening = save.world.opening!;
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const room = ROOMS.find(r => r.id === opening.roomId);
  const total = opening.facts.length;
  const scoreLine = <p className="challenge-score" role="status" aria-live="polite">נכון לבד: <bdi dir="ltr">{opening.score}/{total}</bdi></p>;
  if (opening.finished) {
    const toLearn = opening.missed.length;
    return <section className="room-opening card" aria-label="אתגר פתיחת חדר — תוצאה">
      <h2>{room?.name} — כמעט!</h2>
      {scoreLine}
      <p>נזכרת לבד ב־<bdi dir="ltr">{opening.score}</bdi> עובדות. כדי לפתוח את החדר צריך את כל <bdi dir="ltr">{total}</bdi> באותו ניסיון.</p>
      {toLearn > 0 && <p>נחזק יחד את <bdi dir="ltr">{toLearn}</bdi> העובדות שעוד צריכות עזרה, ואז ננסה שוב — בלי לחץ, ושום דבר לא הולך לאיבוד.</p>}
      <div className="fact-chips" dir="ltr">{opening.missed.map(k => { const [x, y] = parseKey(k); return <span key={k} className="fact-chip">{x} × {y}</span>; })}</div>
      <div className="row wrap">
        {onGo && <button className="primary" onClick={() => { update(s => closeOpening(s, true)); onGo('learn'); }}>לחזק את העובדות האלה</button>}
        <button className="secondary" onClick={() => update(s => startOpening(closeOpening(s, true), opening.roomId))}>ניסיון חדש</button>
        <button className="ghost" onClick={() => update(s => closeOpening(s, true))}>אחר כך</button>
      </div>
    </section>;
  }
  const key = opening.facts[opening.index];
  if (!key) return null;
  const [a, b] = parseKey(key);
  const answer = a * b;
  return <section className="room-opening card" aria-label="אתגר פתיחת חדר">
    <h2>אתגר: פותחות את {room?.name}</h2>
    <p>עשר עובדות שכבר למדנו. החדר נפתח כשכל העשר נזכרות לבד באותו ניסיון. אפשר תמיד לבקש עזרה — היא פשוט לא נספרת.</p>
    <div className="row between"><span>שאלה <bdi dir="ltr">{opening.index + 1}</bdi> מתוך <bdi dir="ltr">{total}</bdi></span>{scoreLine}</div>
    <form onSubmit={e => {
      e.preventDefault();
      if (value.trim() === '' || opening.helped) return;
      if (Number(value) !== answer) { update(s => exposeOpening(recordAnswer(s, { a, b, outcome: 'wrong', usedHint: false }, Date.now()))); setMessage('לא נורא — הנה דרך לחשב. השאלה הזאת לא נספרת, ממשיכות.'); return; }
      update(s => s.world.opening?.roomId === opening.roomId && s.world.opening.index === opening.index ? answerOpening(s, Date.now(), false) : s);
    }}>
      <label className="opening-equation" dir="ltr"><span>{a} × {b} =</span><input autoFocus inputMode="numeric" aria-label="התשובה" value={value} disabled={opening.helped} onChange={e => setValue(e.target.value)} /></label>
      {!opening.helped && <div className="row"><button type="submit" className="primary">בודקות</button><button type="button" className="secondary" onClick={() => update(exposeOpening)}>עוד לא זוכרת — אפשר עזרה</button></div>}
    </form>
    {opening.helped && <div className="opening-help"><p><RichText text={buildHints(a, b, () => false)[2].text} /></p><p dir="ltr" className="opening-answer">{a} × {b} = {answer}</p><button className="primary" onClick={() => update(s => s.world.opening?.roomId === opening.roomId && s.world.opening.index === opening.index ? answerOpening(s, Date.now(), true) : s)}>אמרתי בקול, ממשיכות</button></div>}
    <p role="status">{message}</p>
    <button className="ghost small" onClick={() => update(s => closeOpening(s, false))}>לעצור את האתגר</button>
  </section>;
}

/** Activity equipment stays in room coordinates while zooming or moving furniture. */
export function RoomActivityScenery({ roomId }: { roomId: RoomId }) {
  const { save } = useStore();
  if (roomId === 'garden') return <g pointerEvents="none"><circle cx={520} cy={445} r={15} fill="#f7bc66" stroke="#8a644c" strokeWidth={2}/><path d="M508 438Q520 445 532 438 M520 431V459" fill="none" stroke="#fff6df" strokeWidth={3}/><path d="M252 433H308L300 455H260Z" fill="#c6a8dc" stroke="#8a644c" strokeWidth={2}/><ellipse cx={280} cy={433} rx={28} ry={7} fill="#ba926c"/></g>;
  if(roomId==='cafe'){const ready=save.world.activities.cafe>0;return <g pointerEvents="none"><ellipse cx={485} cy={444} rx={60} ry={13} fill="#ad7999" opacity=".17"/>{ready&&<><path d="M449 422H490L484 444H455Z" fill="#75cbbb" stroke="#705167" strokeWidth="3"/><ellipse cx={470} cy={422} rx={21} ry={7} fill="#b7ebed"/><circle cx={518} cy={433} r={13} fill="#e6b576" stroke="#8a604c" strokeWidth="2"/><circle cx={514} cy={429} r={2} fill="#9b6a52"/><circle cx={521} cy={436} r={2} fill="#9b6a52"/></>}</g>;}
  if(roomId==='craft'){const ready=save.world.activities.craft>0;return ready?<g pointerEvents="none" transform="translate(525 380) rotate(8)"><rect width="72" height="58" rx="8" fill="#fff3d8" stroke="#927396" strokeWidth="2"/><path d="M35 22c-12-13-25 4-12 15l12 9 12-9c13-11 0-28-12-15" fill="#ed8fac"/><path d="M8 9h12 M52 48h11" stroke="#79c9ba" strokeWidth="4"/></g>:null;}
  if(roomId==='bathroom'&&save.world.activities.bathroom>0)return <g key={save.world.activities.bathroom} className="bath-bubbles" pointerEvents="none">{[0,1,2,3,4,5].map(i=><g key={i} style={{animationDelay:(i*.08)+'s'}}><circle cx={350+i*25} cy={340+(i%3)*24} r={10+i%3*4} fill="#c1edf0" fillOpacity=".7" stroke="#69b9cf" strokeWidth="2"/><circle cx={347+i*25} cy={336+(i%3)*24} r="3" fill="#fff"/></g>)}</g>;
  if(roomId==='kitchen'&&save.world.activities.kitchen>0)return <g key={save.world.activities.kitchen} pointerEvents="none" className="kitchen-steam"><ellipse cx="500" cy="420" rx="30" ry="12" fill="#f3ba8b"/><path d="M480 405q-8-15 0-25t0-20 M500 405q-8-15 0-25t0-20 M520 405q-8-15 0-25t0-20" fill="none" stroke="#fff7e5" strokeWidth="5" strokeLinecap="round"/></g>;
  if (roomId !== 'stage') return null;
  const step = save.world.activities.stage % 3;
  return <g pointerEvents="none" className={`stage-equipment stage-equipment-${step}`}><ellipse cx={400} cy={445} rx={100} ry={16} fill="#9f7ca0" opacity={.15}/>{step === 0 ? <ellipse cx={400} cy={373} rx={74} ry={45} fill="none" stroke="#c58ddd" strokeWidth={8}/> : step === 1 ? <circle cx={455} cy={420} r={27} fill="#efb870" stroke="#a56d50" strokeWidth={3}/> : <><path d="M350 420L385 340" stroke="#80606c" strokeWidth={6}/><path d="M385 340Q460 300 490 345T420 385T515 425" fill="none" stroke="#d48caf" strokeWidth={9}/></>}<text x={400} y={483} textAnchor="middle" fill="#775576" fontSize={16}>{['חישוק', 'כדור', 'סרט'][step]}</text></g>;
}
