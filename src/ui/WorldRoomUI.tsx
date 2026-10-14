import { useState } from 'react';
import { RoomThumbnail } from '../art/WorldRooms';
import { paletteById } from '../content/catalog';
import { parseKey } from '../learning/facts';
import { buildHints } from '../learning/hints';
import { RichText } from './common';
import type { Screen } from '../App';
import { useStore } from '../state/store';
import { ROOMS, roomReadiness, switchRoom, startOpening, exposeOpening, answerOpening, roomActivity, editRoom } from '../state/world';
import { moveDog,recordAnswer } from '../state/game';
import './WorldRoomUI.css';

type RoomId = 'studio' | 'dressing' | 'garden' | 'stage';
export function RoomNavigation({ onSwitch }: { onSwitch: () => void }) {
  const { save, update } = useStore();
  return <nav className="world-room-tabs" aria-label="חדרי העולם">
    {ROOMS.map(room => {
      const unlocked = save.world.unlocked.includes(room.id);
      const readiness = roomReadiness(save, room.id);
      return <button key={room.id} className={`world-room-tab ${save.world.activeRoom === room.id ? 'on' : ''}`} aria-current={save.world.activeRoom === room.id ? 'page' : undefined} aria-label={`${room.name}${unlocked ? '' : readiness.ready ? ', אפשר לפתוח' : ', נעול'}`} onClick={() => {
        if (unlocked) { onSwitch(); update(s => switchRoom(s, room.id)); }
        else if (readiness.ready) update(s => startOpening(s, room.id));
      }} aria-disabled={!unlocked && !readiness.ready}>
        <RoomThumbnail id={room.id} p={paletteById(save.profile.paletteId)} />
        <strong>{room.name}</strong>
        {!unlocked && <span className="room-readiness">{readiness.ready ? '✨ טקס פתיחה' : `🔒 ${Math.min(readiness.sessions, room.sessions)}/${room.sessions} שיעורים · ${Math.min(readiness.days, room.days)}/${room.days} ימים · ${Math.min(readiness.taught, 4)}/4 עובדות`}</span>}
      </button>;
    })}
  </nav>;
}
export function RoomActivities({ roomId, onGo }: { roomId: RoomId; onGo: (screen: Screen) => void }) {
  const { save, update } = useStore();
  const [gardenAction, setGardenAction] = useState('');
  if (roomId === 'studio') return null;
  if (roomId === 'dressing') return <div className="room-activity"><span>מראות, בגדים ומראה חדש לכלב שלך</span><button className="primary" onClick={() => onGo('wardrobe')}>לארון הבגדים</button></div>;
  if (roomId === 'garden') return <div className="room-activity"><div><strong>זמן יחד בגן</strong><span role="status">{gardenAction || 'משחק ואוכל לכלב'} · {save.world.activities.garden} פעילויות</span></div>{['לשחק בכדור', 'להאכיל'].map((label, index) => <button key={label} className="secondary" onClick={() => {
    setGardenAction(index === 0 ? 'הכלב רץ אל הכדור!' : 'הכלב נהנה מהאוכל!');
    update(s => editRoom(roomActivity(s, 'garden'), 'garden', draft => moveDog(draft, index === 0 ? 520 : 280, 420)));
  }}>{label}</button>)}</div>;
  const count = save.world.activities.stage;
  const step = count % 3;
  const labels = ['סיבוב בחישוק', 'גלגול כדור', 'ריקוד בסרט'];
  return <div className="room-activity"><div><strong>תרגיל במה בשלושה צעדים</strong><span role="status">{Math.floor(count / 3)} מופעים הושלמו · צעד {step + 1} מתוך 3</span></div><ol className="stage-steps">{labels.map((label, i) => <li key={label} className={i === step ? 'on' : i < step ? 'done' : ''}><span aria-hidden="true">{['◯', '●', '〰'][i]}</span>{label}</li>)}</ol><button className="primary" onClick={() => update(s => roomActivity(s, 'stage'))}>{labels[step]}</button></div>;
}
export function RoomOpening() {
  const { save } = useStore();
  const opening = save.world.opening;
  return opening ? <OpeningQuestion key={`${opening.roomId}-${opening.index}`} /> : null;
}
function OpeningQuestion() {
  const { save, update } = useStore();
  const opening = save.world.opening!;
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const key = opening.facts[opening.index];
  const room = ROOMS.find(r => r.id === opening.roomId);
  if (!key) return null;
  const [a, b] = parseKey(key);
  const answer = a * b;
  return <section className="room-opening card" aria-label="טקס פתיחת חדר"><h2>פותחות את {room?.name}</h2><p>ארבע עובדות שכבר למדנו. אפשר להיעזר תמיד — כל צעד מקרב אותנו לפתיחה.</p><span>עובדה {opening.index + 1} מתוך {opening.facts.length}</span><form onSubmit={e => {
    e.preventDefault();
    if (value.trim() === '') return;
    if (Number(value) !== answer) { update(s=>exposeOpening(recordAnswer(s,{a,b,outcome:'wrong',usedHint:opening.helped},Date.now()))); setMessage('ננסה שוב יחד עם העזרה.'); return; }
    update(s => s.world.opening?.roomId === opening.roomId && s.world.opening.index === opening.index ? answerOpening(s, Date.now(), opening.helped) : s);
  }}><label className="opening-equation" dir="ltr"><span>{a} × {b} =</span><input autoFocus inputMode="numeric" aria-label="התשובה" value={value} onChange={e => setValue(e.target.value)} /></label><div className="row"><button type="submit" className="primary">ממשיכות</button><button type="button" className="secondary" onClick={() => update(exposeOpening)}>עוד לא זוכרת — אפשר עזרה</button></div></form>{opening.helped && <div className="opening-help"><p><RichText text={buildHints(a,b,()=>false)[2].text}/></p><button className="primary" onClick={()=>update(s=>s.world.opening?.roomId===opening.roomId&&s.world.opening.index===opening.index?answerOpening(s,Date.now(),true):s)}>אמרתי בקול, ממשיכות יחד</button></div>}<p role="status">{message}</p></section>;
}

/** Activity equipment stays in room coordinates while zooming or moving furniture. */
export function RoomActivityScenery({ roomId }: { roomId: RoomId }) {
  const { save } = useStore();
  if (roomId === 'garden') return <g pointerEvents="none"><circle cx={520} cy={445} r={15} fill="#f7bc66" stroke="#8a644c" strokeWidth={2}/><path d="M508 438Q520 445 532 438 M520 431V459" fill="none" stroke="#fff6df" strokeWidth={3}/><path d="M252 433H308L300 455H260Z" fill="#c6a8dc" stroke="#8a644c" strokeWidth={2}/><ellipse cx={280} cy={433} rx={28} ry={7} fill="#ba926c"/></g>;
  if (roomId !== 'stage') return null;
  const step = save.world.activities.stage % 3;
  return <g pointerEvents="none" className={`stage-equipment stage-equipment-${step}`}><ellipse cx={400} cy={445} rx={100} ry={16} fill="#9f7ca0" opacity={.15}/>{step === 0 ? <ellipse cx={400} cy={373} rx={74} ry={45} fill="none" stroke="#c58ddd" strokeWidth={8}/> : step === 1 ? <circle cx={455} cy={420} r={27} fill="#efb870" stroke="#a56d50" strokeWidth={3}/> : <><path d="M350 420L385 340" stroke="#80606c" strokeWidth={6}/><path d="M385 340Q460 300 490 345T420 385T515 425" fill="none" stroke="#d48caf" strokeWidth={9}/></>}<text x={400} y={483} textAnchor="middle" fill="#775576" fontSize={16}>{['חישוק', 'כדור', 'סרט'][step]}</text></g>;
}
