import { unlockBackgroundMusic } from '../ui/MusicPlayback';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { DogFigure,type DogMood } from '../art/Dog';
import { FurnitureArt, FurnitureThumb } from '../art/Furniture';
import { FLOOR_Y } from '../art/Scenes';
import { RoomScenery } from '../art/WorldRooms';
import { getRoom, editRoom, ROOMS } from '../state/world';
import { RoomNavigation, RoomActivities, RoomOpening, RoomActivityScenery, WorldGameMenu } from '../ui/WorldRoomUI';
import { BACKGROUNDS, FURNITURE, furnitureById, furnitureCategory, PALETTES, paletteById, SWATCHES,WEARABLES,SLOT_LABEL,SLOT_ORDER,type Slot } from '../content/catalog';
import { dogById, STARTER_DOG_IDS } from '../content/dogs';
import type { Screen } from '../App';
import { placedUid, placeFurniture, removePlaced, setStudioDog, updatePlaced,toggleItem,setOwnOutfit } from '../state/game';
import { WearableThumb } from '../ui/DressingRoom';
import { useStore } from '../state/store';
import type { SaveData, PlacedItem } from '../state/types';
import { Icon } from '../ui/icons';
import { sfx,setSoundEnabled } from '../ui/sound';
import { useToast } from '../ui/toast';
import {beginItemDrag,advanceItemDrag,finishItemDrag,type ItemDrag} from '../ui/itemDrag';
import { DesignWorkspace } from '../ui/DesignWorkspace';

import {resolveDrop,moveWithSupports} from '../state/placement';
import {BirthdayStory,BirthdayScenery} from '../ui/BirthdayStory';
import { sceneOrder,changeLayer } from '../state/layers';
import { addCharacter, characterName, characterOf, CHARACTER_DOG_SCALE, FAMILY_PREFIX, GUEST_PREFIX, HUMAN_PREFIX, HUMAN_SCALE, MAX_CHARACTERS, charactersIn, setHumanOutfit } from '../state/characters';
import { HumanFigure } from '../art/Humans';
import { FAMILY, familyById, familySize } from '../content/family';
import { HUMANS, HUMAN_SLOT_LABEL, HUMAN_WEARABLES, humanById, type HumanSlot } from '../content/humans';
const DOG_UID = '__dog__';
const DOG_SCALE = 0.56;

export function Studio({ onGo, hasClient }: { onGo: (s: Screen) => void; hasClient: boolean }) {
  const { save, update: updateSave } = useStore();
  const activeRoom = save.world.activeRoom;
  const room = getRoom(save, activeRoom);
  const update = (fn: (s: SaveData) => SaveData) => updateSave(s => editRoom(s, activeRoom, fn));
  const notify = useToast();
  const p = paletteById(save.profile.paletteId);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dogMood,setDogMood]=useState<DogMood>('idle');
  const [dogCaption,setDogCaption]=useState('');
  const dogTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const reactDog=(mood:DogMood,caption:string)=>{if(dogTimer.current)clearTimeout(dogTimer.current);setDogMood(mood);setDogCaption(caption);if(mood!=='sleep'&&mood!=='sit')dogTimer.current=setTimeout(()=>{setDogMood('idle');setDogCaption('');},2400);};
  useEffect(()=>()=>{if(dogTimer.current)clearTimeout(dogTimer.current);},[]);
  const [guestMood,setGuestMood]=useState<Record<string,DogMood>>({});
  const guestTimers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});
  useEffect(()=>()=>{for(const t of Object.values(guestTimers.current))clearTimeout(t);},[]);
  const reactGuest=(uid:string,mood:DogMood)=>{clearTimeout(guestTimers.current[uid]);setGuestMood(m=>({...m,[uid]:mood}));guestTimers.current[uid]=setTimeout(()=>setGuestMood(m=>{const n={...m};delete n[uid];return n;}),2400);};
  const [humanSlot,setHumanSlot]=useState<HumanSlot>('top');
  /** A short walk: the dog walks a few steps (one step when motion is reduced) and stops. */
  const walkDog=()=>{reactDog('walk','יוצאים לטיול קטן!');sfx.tap();if(room.dog.supportUid)return;const dir=room.dog.x>600?-1:1;const steps=save.settings.reduceMotion?1:6;for(let i=1;i<=steps;i++)setTimeout(()=>updateSave(s=>editRoom(s,activeRoom,d=>({...d,studio:{...d.studio,dog:{...d.studio.dog,x:Math.max(-360,Math.min(1160,d.studio.dog.x+dir*(120/steps)))}}}))),i*320);};
  const [selected, setSelected] = useState<string | null>(null);
  const [editing,setEditing]=useState(false);
  const [drag,setDrag]=useState<ItemDrag|null>(null);
  const dragLive=useRef<ItemDrag|null>(null),skipClick=useRef(false);
  const [placing,setPlacing]=useState(false);
  const dragFrame=useRef<number|null>(null);
  const clearDrag=()=>{if(dragFrame.current!==null)cancelAnimationFrame(dragFrame.current);dragFrame.current=null;dragLive.current=null;setDrag(null);};
  useEffect(()=>()=>{if(dragFrame.current!==null)cancelAnimationFrame(dragFrame.current);},[]);
  const [tab, setTab] = useState<'storage' | 'walls' | 'dog' | 'clothes'>('storage');
  const [storageCategory,setStorageCategory]=useState('all');
  const [storageView,setStorageView]=useState<'stored'|'room'>('stored');
  const [clothesSlot,setClothesSlot]=useState<Slot>('body');
  useEffect(() => { setSelected(null); clearDrag();setPlacing(false);setDogMood('idle');setDogCaption('');if(dogTimer.current)clearTimeout(dogTimer.current); }, [activeRoom]);
  const activityRef=useRef({room:activeRoom,count:save.world.activities[activeRoom as keyof typeof save.world.activities]??0});
  const activityCount=save.world.activities[activeRoom as keyof typeof save.world.activities]??0;
  useEffect(()=>{const previous=activityRef.current;if(previous.room===activeRoom&&activityCount>previous.count)reactDog(activeRoom==='bathroom'?'shake':'happy',activeRoom==='bathroom'?'כל הבועות עפו!':'איזה כיף לשחק יחד!');activityRef.current={room:activeRoom,count:activityCount};},[activeRoom,activityCount]);
  const learning = !!save.learning.learnSession;
  const ownDog = dogById(save.profile.ownDogId);
  const tipMove = !save.tips.includes('studio-move');
  const firstClient = save.progress.clientsServed === 0;

  const markMoved = () => {
    if (tipMove) update((s) => ({ ...s, tips: [...s.tips, 'studio-move'] }));
  };

  const toRoom = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: pt.x, y: pt.y };
  };

  const posOf=(uid:string,seen=new Set<string>()):{x:number;y:number}=>{
   if(drag&&drag.uid===uid)return drag.moved?resolveDrop(room,uid,{x:drag.x,y:drag.y}):{x:drag.x,y:drag.y};
   const item=uid===DOG_UID?room.dog:room.items.find(i=>i.uid===uid);if(!item)return {x:400,y:400};
   if(item.supportUid&&!seen.has(uid)){seen.add(uid);const host=room.items.find(i=>i.uid===item.supportUid);if(host){const pos=posOf(host.uid,seen);return {x:item.x+pos.x-host.x,y:item.y+pos.y-host.y};}}
   return {x:item.x,y:item.y};
  };
  const commitMove=(uid:string,x:number,y:number)=>{
   update(s=>{const drop=resolveDrop(s.studio,uid,{x,y});drop.x=Math.max(uid===DOG_UID?-360:-380,Math.min(uid===DOG_UID?1160:1180,drop.x));drop.y=Math.max(uid===DOG_UID&&!drop.supportUid?340:0,Math.min(uid===DOG_UID?495:500,drop.y));const moved=moveWithSupports(s,uid,drop.x,drop.y);return uid===DOG_UID?{...moved,studio:{...moved.studio,dog:{...moved.studio.dog,supportUid:drop.supportUid}}}:{...moved,studio:{...moved.studio,items:moved.studio.items.map(item=>item.uid===uid?{...item,supportUid:drop.supportUid}:item)}};});
   markMoved();
  };

  const onItemDown=(e:PointerEvent,uid:string)=>{
   if(e.button!==0)return;e.stopPropagation();
   const d=beginItemDrag(uid,e.pointerId,toRoom(e.clientX,e.clientY),posOf(uid));
   dragLive.current=d;setDrag(d);setSelected(uid);setEditing(false);setPlacing(false);if(uid===DOG_UID){setDogMood('idle');setDogCaption('');}
   svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove=(e:PointerEvent)=>{const d=dragLive.current;if(!d)return;const next=advanceItemDrag(d,e.pointerId,toRoom(e.clientX,e.clientY));dragLive.current=next;if(dragFrame.current===null)dragFrame.current=requestAnimationFrame(()=>{dragFrame.current=null;setDrag(dragLive.current);});};
  const onUp=(e:PointerEvent)=>{const result=finishItemDrag(dragLive.current,e.pointerId,toRoom(e.clientX,e.clientY));if(!result)return;skipClick.current=true;if(result.moved){commitMove(result.uid,result.x,result.y);setSelected(null);setEditing(false);setPlacing(false);}else if(result.uid===DOG_UID){reactDog('pet','איזה כיף שאת כאן!');sfx.gentle();}else if(room.items.find(i=>i.uid===result.uid)?.itemId.startsWith(GUEST_PREFIX)){reactGuest(result.uid,'wag');sfx.gentle();}clearDrag();};
  const onRoomClick=(e:MouseEvent)=>{if(skipClick.current){skipClick.current=false;return;}if(selected&&placing){const point=toRoom(e.clientX,e.clientY);commitMove(selected,point.x,point.y);}setSelected(null);setEditing(false);setPlacing(false);};

  const onKey = (e: KeyboardEvent, uid: string) => {
    const step = e.shiftKey ? 30 : 10;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelected(selected === uid ? null : uid);
    } else if (map[e.key]) {
      e.preventDefault();
      setSelected(uid);
      const pos = posOf(uid);
      commitMove(uid, pos.x + map[e.key][0], pos.y + map[e.key][1]);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && uid !== DOG_UID) {
      update((s) => removePlaced(s, uid));
      setSelected(null);
    }
  };

  const sel = selected && selected !== DOG_UID ? room.items.find((i) => i.uid === selected) : null;
  const dogPos = posOf(DOG_UID);
  const depth=sceneOrder({...room,dog:dogPos,items:room.items.map(item=>({...item,...posOf(item.uid)}))}).map(id=>id===DOG_UID?'dog' as const:room.items.find(p=>p.uid===id)!);

  const availableItems = FURNITURE.filter((f) => save.owned.furniture.includes(f.id) && (storageView==='room'?room.items.some(i=>i.itemId===f.id):!room.items.some(i=>i.itemId===f.id)));
  const storageItems=availableItems.filter(f=>storageCategory==='all'||furnitureCategory(f)===storageCategory);

  const renderCharacter = (it: PlacedItem) => {
    const c = characterOf(it.itemId)!;
    const pos = posOf(it.uid);
    const isSel = selected === it.uid;
    const seated = !!it.supportUid;
    const name = characterName(it.itemId);
    const common = {
      className: `room-item room-character ${isSel ? 'selected' : ''} ${drag?.uid===it.uid&&drag.moved?'item-dragging':''}`,
      onPointerDown: (e: PointerEvent) => onItemDown(e, it.uid),
      onClick: (e: MouseEvent) => { skipClick.current = false; e.stopPropagation(); },
      onKeyDown: (e: KeyboardEvent) => onKey(e, it.uid),
      tabIndex: 0,
      role: 'button',
      'aria-label': `${name}${seated ? ', על מושב' : ''}${isSel ? ' (נבחר)' : ''}`,
      'aria-pressed': isSel,
    } as const;
    if (c.kind === 'dog') {
      const d = dogById(c.id);
      const s = CHARACTER_DOG_SCALE * it.scale;
      const mood = guestMood[it.uid] ?? (seated ? 'sit' : 'idle');
      return (
        <g key={it.uid} {...common} transform={`translate(${pos.x} ${pos.y}) scale(${it.flip ? -s : s} ${s}) translate(-120 -240)`}>
          <rect x={30} y={30} width={180} height={215} className="hit" />
          <DogFigure dog={d} outfit={save.outfits[c.id]} mood={mood} asGroup />
        </g>
      );
    }
    if (c.kind === 'family') {
      // a ready-made illustration: feet on the item's point, set height, own aspect ratio, never mirrored
      const m = familyById(c.id)!;
      const { w: fw, h: fh } = familySize(m);
      return (
        <g key={it.uid} {...common} transform={`translate(${pos.x} ${pos.y})`}>
          {/* the picture never takes the touch (iOS would start its own image drag / long-press menu);
              the transparent area on top of it does, so the figure drags like furniture */}
          <image href={m.src} x={-fw / 2} y={-fh} width={fw} height={fh} preserveAspectRatio="xMidYMax meet" pointerEvents="none" className="family-figure" />
          <rect x={-fw / 2} y={-fh} width={fw} height={fh} className="hit" />
        </g>
      );
    }
    const h = humanById(c.id)!;
    const s = HUMAN_SCALE * it.scale;
    return (
      <g key={it.uid} {...common} transform={`translate(${pos.x} ${pos.y}) scale(${it.flip ? -s : s} ${s})`}>
        <rect x={-70} y={-320} width={140} height={330} className="hit" />
        <HumanFigure human={h} outfit={it.outfit} pose={seated ? 'sit' : 'stand'} asGroup />
      </g>
    );
  };

  const renderItem = (it: PlacedItem) => {
    if (characterOf(it.itemId)) return renderCharacter(it);
    const f = furnitureById(it.itemId)!;
    const pos = posOf(it.uid);
    const isSel = selected === it.uid;
    return (
      <g
        key={it.uid}
        className={`room-item ${isSel ? 'selected' : ''} ${drag?.uid===it.uid&&drag.moved?'item-dragging':''}`}
        transform={`translate(${pos.x} ${pos.y}) scale(${it.flip ? -it.scale : it.scale} ${it.scale})`}
        onPointerDown={(e) => onItemDown(e, it.uid)}
        onClick={(e) => {skipClick.current=false;e.stopPropagation();}}
        onKeyDown={(e) => onKey(e, it.uid)}
        tabIndex={0}
        role="button"
        aria-label={`${f.name}${isSel ? ' (נבחר)' : ''}`}
        aria-pressed={isSel}
      >
        <rect x={-f.w / 2 - 6} y={-f.h - 6} width={f.w + 12} height={f.h + 12} rx={12} className="hit" />
        <FurnitureArt id={it.itemId} p={p} color={it.color} />
      </g>
    );
  };

  return (
    <DesignWorkspace sound={save.settings.sound} onToggleSound={()=>{const next=!save.settings.sound;setSoundEnabled(next);if(next){unlockBackgroundMusic();sfx.tap();}updateSave(s=>({...s,settings:{...s.settings,sound:next}}));}} onTool={setTab} focusY={250} title={ROOMS.find(r => r.id === activeRoom)?.name ?? "עיצוב הסטודיו"} navigation={<><RoomNavigation onSwitch={() => { setSelected(null); setDrag(null); }} /><RoomOpening onGo={onGo} /><WorldGameMenu onGo={onGo} /><BirthdayStory onGo={onGo}/></>} bounds={{x:-400,y:0,width:1600,height:500,horizontal:true}}>{({viewBox,closeDrawer,gesture,onCameraKey}) => (
    <div className="studio-screen">
      <section className="studio-stage card" aria-label={ROOMS.find(r => r.id === activeRoom)?.name}>
        <div className="room-wrap">
          <svg
            ref={svgRef}
            className={`room ${selected ? 'placing' : ''}`}
            viewBox={viewBox}
            onPointerDownCapture={e=>{gesture.onPointerDownCapture(e);if(gesture.isCameraActive()){clearDrag();e.stopPropagation();}}}
            onPointerMove={e=>{gesture.onPointerMove(e);if(gesture.isCameraActive())clearDrag();else onMove(e);}}
            onPointerUp={e=>{gesture.onPointerUp(e);if(gesture.isCameraActive())clearDrag();else onUp(e);}}
            onPointerCancel={e=>{gesture.onPointerCancel(e);clearDrag();}}
            onClickCapture={gesture.onClickCapture}
            onClick={onRoomClick}
            onKeyDown={onCameraKey}
            tabIndex={0}
            role="application"
            aria-label="חדר המשחק: גררי את הרקע לצדדים; גררי פריט; נגיעה ברקע משחררת אותו"
          >
            <RoomScenery id={activeRoom} wall={room.wall} floor={room.floor} p={p} />
            <text x={780} y={FLOOR_Y - 284} textAnchor="end" fontSize={22} fontWeight={700} fill={p.accent} opacity={0.35} fontFamily="Rubik, Arial, sans-serif">
              {save.profile.studioName}
            </text>
            <RoomActivityScenery roomId={activeRoom} />
            <BirthdayScenery/>
            {depth.map((d) =>
              d === 'dog' ? (
                <g
                  key="dog"
                  className={`room-item ${selected === DOG_UID ? 'selected' : ''}`}
                  transform={`translate(${dogPos.x - 120 * DOG_SCALE} ${dogPos.y - 240 * DOG_SCALE}) scale(${DOG_SCALE})`}
                  onPointerDown={(e) => onItemDown(e, DOG_UID)}
                  onClick={(e) => {skipClick.current=false;e.stopPropagation();}}
                  onKeyDown={(e) => onKey(e, DOG_UID)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${ownDog.name}, הכלב של הסטודיו`}
                >
                  <rect x={-40} y={-60} width={320} height={330} className="hit" />
                  <DogFigure dog={ownDog} outfit={save.outfits[ownDog.id]} mood={dogMood==='idle'&&room.dog.supportUid?'sit':dogMood} asGroup />
                </g>
              ) : (
                renderItem(d)
              )
            )}
          </svg>
          {placing&&<p className="placing-instruction" role="status">הקישי בחדר כדי להניח כאן את הפריט</p>}
          {tipMove && (
            <p className="tip-bubble" role="note">
              <Icon name="sparkle" size={18} /> גררי פריט כדי להזיז אותו. נגיעה ברקע משחררת את הבחירה.
            </p>
          )}
        </div>

        {dogCaption&&<p className="dog-reaction-caption" role="status">{ownDog.name}: {dogCaption}</p>}
        {selected===DOG_UID&&!editing&&<div className="dog-care-actions" role="group" aria-label="זמן עם הכלב"><button className="secondary" onClick={()=>{reactDog('pet','איזה ליטוף נעים!');sfx.gentle();}}>ללטף</button><button className="secondary" onClick={()=>{reactDog('play','יש! זמן לשחק בכדור!');sfx.tap();}}>לשחק</button><button className="secondary" onClick={walkDog}>לטייל</button><button className="secondary" onClick={()=>{reactDog('wag','כשכוש של שמחה!');}}>לכשכש</button><button className="secondary" onClick={()=>reactDog(dogMood==='sit'?'idle':'sit',dogMood==='sit'?'קמתי!':'יושב יפה')}>{dogMood==='sit'?'לקום':'לשבת'}</button><button className="secondary" onClick={()=>reactDog(dogMood==='sleep'?'happy':'sleep',dogMood==='sleep'?'בוקר טוב!':'אני נרדם לי בנחת…')}>{dogMood==='sleep'?'להתעורר':'לנוח'}</button></div>}
        <RoomActivities key={activeRoom} roomId={activeRoom} onGo={onGo} />
        {selected&&!editing&&<div className="item-context"><button className="hud-button" aria-label="עריכת הפריט הנבחר" onClick={()=>setEditing(true)}><Icon name="edit"/><span>עריכה</span></button><button className="hud-button" aria-label="ביטול בחירת פריט" onClick={()=>setSelected(null)}><Icon name="check"/><span>סיימתי</span></button></div>}
        {selected && editing && (
          <div className="toolbar" role="toolbar" aria-label="עריכת פריט">
            <button className="secondary small" onClick={()=>{setPlacing(true);setEditing(false);}}>בחירת מיקום בלחיצה</button>
            <strong className="toolbar-title">{selected === DOG_UID ? ownDog.name : furnitureById(sel?.itemId ?? '')?.name ?? characterName(sel?.itemId ?? '')}</strong>
            <button className="secondary small" onClick={()=>update(s=>changeLayer(s,selected,'front'))}>לקדמה</button>
            <button className="secondary small" onClick={()=>update(s=>changeLayer(s,selected,'back'))}>לרקע</button>

            {sel && (
              <>
                {characterOf(sel.itemId)?.kind !== 'family' && (<>
                <button className="icon-btn" onClick={() => update((s) => updatePlaced(s, sel.uid, { scale: sel.scale - 0.1 }))} aria-label="להקטין">
                  <Icon name="minus" />
                </button>
                <button className="icon-btn" onClick={() => update((s) => updatePlaced(s, sel.uid, { scale: sel.scale + 0.1 }))} aria-label="להגדיל">
                  <Icon name="plus" />
                </button>
                <button className="icon-btn" onClick={() => update((s) => updatePlaced(s, sel.uid, { flip: !sel.flip }))} aria-label="היפוך">
                  <Icon name="flip" />
                </button>
                </>)}
                <button
                  className="secondary small"
                  onClick={() => {
                    update((s) => removePlaced(s, sel.uid));
                    setSelected(null);
                    notify(characterOf(sel.itemId) ? `${characterName(sel.itemId)} יצא מהחדר. אפשר להחזיר מ״דמויות״.` : 'הפריט חזר למחסן');
                  }}
                >
                  {characterOf(sel.itemId) ? 'להוציא מהחדר' : 'למחסן'}
                </button>
              </>
            )}
            {selected === DOG_UID && (
              <button className="secondary small" onClick={() => onGo('wardrobe')}>
                להלביש
              </button>
            )}
            <button className="primary small" onClick={() => setSelected(null)}>
              סיימתי
            </button>
          </div>
        )}
        {sel && editing && characterOf(sel.itemId)?.kind === 'human' && (
          <div className="human-dresser" role="group" aria-label={`בגדים ל${characterName(sel.itemId)}`}>
            <div className="chips">{(Object.keys(HUMAN_SLOT_LABEL) as HumanSlot[]).map(slot=><button key={slot} className={`chip ${humanSlot===slot?'on':''}`} aria-pressed={humanSlot===slot} onClick={()=>setHumanSlot(slot)}>{HUMAN_SLOT_LABEL[slot]}</button>)}</div>
            <div className="chips">{HUMAN_WEARABLES.filter(w=>w.slot===humanSlot).map(w=>{const cur=(sel.outfit??humanById(characterOf(sel.itemId)!.id)!.defaultOutfit)[humanSlot]?.itemId===w.id;return <button key={w.id} className={`chip ${cur?'on':''}`} aria-pressed={cur} onClick={()=>update(s=>setHumanOutfit(s,sel.uid,humanSlot,cur?null:w.id))}><span className="swatch-dot" style={{background:w.color}} aria-hidden="true"/>{w.name}</button>;})}</div>
          </div>
        )}
        {sel && editing && !characterOf(sel.itemId) && (
          <div className="swatch-row toolbar-colors" role="group" aria-label="צבע הפריט">
            <span className="muted small">צבע:</span>
            <button
              className={`swatch palette-swatch ${!sel.color ? 'on' : ''}`}
              style={{ background: p.accent }}
              aria-label="צבע הפלטה"
              aria-pressed={!sel.color}
              onClick={() => update((s) => updatePlaced(s, sel.uid, { color: undefined }))}
            />
            {SWATCHES.map((sw) => (
              <button
                key={sw.id}
                className={`swatch ${sel.color === sw.hex ? 'on' : ''}`}
                style={{ background: sw.hex }}
                aria-label={sw.name}
                aria-pressed={sel.color === sw.hex}
                onClick={() => update((s) => updatePlaced(s, sel.uid, { color: sw.hex }))}
              />
            ))}
          </div>
        )}
      </section>

      <aside className={`studio-side ${room.dog.x<400?'drawer-on-right':''}`}>
        <button className="drawer-close icon-btn" aria-label="סגירת המגירה" onClick={closeDrawer}><Icon name="close"/></button>
        <h3 className="drawer-heading">{{storage:'המחסן שלי',clothes:'בגדים ואביזרים',walls:'עיצוב החדר',dog:'דמויות'}[tab]}</h3>
        <div className={`learn-call card ${learning ? 'glow' : ''}`}>
          <div className="client-call-text">
            <strong>לומדות וזוכרות</strong>
            <span className="muted small">
              {learning ? 'יש שיעור שעצרנו באמצע — אפשר להמשיך בדיוק מאותו מקום.' : 'שש עובדות כפל: קודם רואים ואומרים בקול, אחר כך מעצבים, ואז מנסים לזכור.'}
            </span>
          </div>
          <button className="primary big" onClick={() => onGo('learn')}>
            <Icon name="sparkle" /> {learning ? 'להמשיך את השיעור' : 'להתחיל ללמוד'}
          </button>
        </div>

        <div className={`client-call card ${firstClient && !learning ? 'glow' : ''}`}>
          <div className="client-call-text">
            <strong>{hasClient ? 'לקוח מחכה לך!' : firstClient ? 'הלקוחה הראשונה שלך בדלת!' : 'מישהו מחכה בדלת!'}</strong>
            <span className="muted small">כל לקוח מביא בקשה עיצובית ומקבץ קצר של תרגילי כפל.</span>
          </div>
          <button className="secondary big" onClick={() => onGo('client')}>
            <Icon name="paw" /> {hasClient ? 'להמשיך' : 'לקבל לקוח'}
          </button>
        </div>

        <div className="card stack">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab==='clothes'} className={tab==='clothes'?'on':''} onClick={()=>setTab('clothes')}>בגדים ואביזרים</button>
            <button role="tab" aria-selected={tab === 'storage'} className={tab === 'storage' ? 'on' : ''} onClick={() => setTab('storage')}>
              המחסן שלי
            </button>
            <button role="tab" aria-selected={tab === 'walls'} className={tab === 'walls' ? 'on' : ''} onClick={() => setTab('walls')}>
              {activeRoom==='garden'?'צבעי הגינה':'עיצוב החדר'}
            </button>
            <button role="tab" aria-selected={tab === 'dog'} className={tab === 'dog' ? 'on' : ''} onClick={() => setTab('dog')}>
              דמויות
            </button>
          </div>
          {tab==='clothes'&&<div className="stack room-clothes"><p className="muted small">בחרי פריט כדי להלביש את {ownDog.name}. לחיצה נוספת מסירה אותו.</p><div className="chips">{SLOT_ORDER.map(slot=><button key={slot} className={`chip ${clothesSlot===slot?'on':''}`} aria-pressed={clothesSlot===slot} onClick={()=>setClothesSlot(slot)}>{SLOT_LABEL[slot]}</button>)}</div><div className="thumb-grid">{WEARABLES.filter(w=>w.slot===clothesSlot&&save.owned.wearables.includes(w.id)).map(w=><button key={w.id} className={`thumb-card ${save.outfits[ownDog.id]?.[w.slot]?.itemId===w.id?'on':''}`} aria-pressed={save.outfits[ownDog.id]?.[w.slot]?.itemId===w.id} aria-label={w.name} onClick={()=>updateSave(s=>setOwnOutfit(s,ownDog.id,toggleItem(s.outfits[ownDog.id]??{},w.id)))}><WearableThumb dog={ownDog} item={w}/><span>{w.name}</span></button>)}</div><button className="secondary" onClick={()=>updateSave(s=>{const outfit={...s.outfits[ownDog.id]};delete outfit[clothesSlot];return setOwnOutfit(s,ownDog.id,outfit);})}>להסיר מהקטגוריה</button><button className="ghost" onClick={()=>onGo('wardrobe')}>מלתחה מלאה וצילום לאלבום</button></div>}

          {tab === 'dog' && (
            <div className="stack">
              <h3>המשפחה</h3>
              <div className="guest-grid family-grid">
                {FAMILY.map((m) => {
                  const id = FAMILY_PREFIX + m.id;
                  const here = room.items.find((i) => i.itemId === id);
                  return (
                    <button key={id} className={`guest-pick ${here ? 'on' : ''}`} aria-pressed={!!here} disabled={!here && charactersIn(room.items).length >= MAX_CHARACTERS}
                      onClick={() => { if (here) { update((s) => removePlaced(s, here.uid)); notify(`${m.name} יצא/ה מהחדר`); } else { const now = Date.now(); update((s) => addCharacter(s, id, now)); sfx.tap(); notify(`${m.name} בחדר!`); } }}>
                      <img src={m.src} alt="" className="family-thumb" />
                      <strong>{m.name}</strong>
                      <span className="tag">{here ? 'בחדר · להוציא' : 'להוסיף'}</span>
                    </button>
                  );
                })}
              </div>
              <h3>אורחים בחדר</h3>
              <p className="muted small">כלבים אורחים ואנשים מצטרפים לחדר בלי להחליף את {ownDog.name}. אפשר לגרור אותם, להושיב על ספה, כורסה או מיטת כלב, ולהוציא מהחדר. עד {MAX_CHARACTERS} בחדר.</p>
              <div className="guest-grid">
                {HUMANS.map((h) => {
                  const id = HUMAN_PREFIX + h.id;
                  const here = room.items.find((i) => i.itemId === id);
                  return (
                    <button key={id} className={`guest-pick ${here ? 'on' : ''}`} aria-pressed={!!here} disabled={!here && charactersIn(room.items).length >= MAX_CHARACTERS}
                      onClick={() => { if (here) { update((s) => removePlaced(s, here.uid)); notify(`${h.name} יצא/ה מהחדר`); } else { const now = Date.now(); update((s) => addCharacter(s, id, now)); sfx.tap(); notify(`${h.name} בחדר! אפשר לגרור ולהלביש.`); } }}>
                      <HumanFigure human={h} />
                      <strong>{h.name}</strong>
                      <span className="tag">{here ? 'בחדר · להוציא' : 'להוסיף'}</span>
                    </button>
                  );
                })}
                {STARTER_DOG_IDS.filter((id) => id !== save.profile.ownDogId).map((id) => {
                  const d = dogById(id);
                  const gid = GUEST_PREFIX + id;
                  const here = room.items.find((i) => i.itemId === gid);
                  return (
                    <button key={gid} className={`guest-pick ${here ? 'on' : ''}`} aria-pressed={!!here} disabled={!here && charactersIn(room.items).length >= MAX_CHARACTERS}
                      onClick={() => { if (here) { update((s) => removePlaced(s, here.uid)); notify(`${d.name} יצא/ה מהחדר`); } else { const now = Date.now(); update((s) => addCharacter(s, gid, now)); sfx.tap(); notify(`${d.name} בא/ה לבקר!`); } }}>
                      <DogFigure dog={d} outfit={save.outfits[id]} />
                      <strong>{d.name}</strong>
                      <span className="tag">{here ? 'בחדר · להוציא' : 'להזמין'}</span>
                    </button>
                  );
                })}
              </div>
              <h3>כלב הסטודיו</h3>
              <p className="muted small">אפשר להחליף את הכלב שגר בסטודיו בכל זמן, בחינם. הבגדים של כל כלב נשמרים.</p>
              <div className="dog-pick-grid compact">
                {STARTER_DOG_IDS.map((id) => {
                  const d = dogById(id);
                  const on = save.profile.ownDogId === id;
                  return (
                    <button
                      key={id}
                      className={`dog-pick ${on ? 'on' : ''}`}
                      aria-pressed={on}
                      onClick={() => {
                        update((s) => setStudioDog(s, id));
                        sfx.tap();
                        notify(`${d.name} גר עכשיו בסטודיו!`);
                      }}
                    >
                      <DogFigure dog={d} outfit={save.outfits[id]} />
                      <strong>{d.name}</strong>
                      <span className="muted small">{d.breed}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'storage' && (
            <div className="stack"><div className="chips" role="group" aria-label="מיקום הפריטים"><button className={`chip ${storageView==='stored'?'on':''}`} aria-pressed={storageView==='stored'} onClick={()=>setStorageView('stored')}>במחסן</button><button className={`chip ${storageView==='room'?'on':''}`} aria-pressed={storageView==='room'} onClick={()=>setStorageView('room')}>בחדר · בחירה ועריכה</button></div><div className="storage-categories chips" role="group" aria-label="קטגוריות המחסן">{[['all','הכול'],['seating','ספות וכורסאות'],['storage','ארונות ומדפים'],['decor','קישוטים'],['textiles','שטיחים וכריות'],['lighting','תאורה'],['kitchen','מטבח וכלים'],['bath','רחצה'],['yard','חצר']].map(([id,label])=><button key={id} className={`chip ${storageCategory===id?'on':''}`} aria-pressed={storageCategory===id} onClick={()=>setStorageCategory(id)}>{label} · {availableItems.filter(f=>id==='all'||furnitureCategory(f)===id).length}</button>)}</div>
              {storageItems.length === 0 ? (
                <p className="muted">אין כרגע פריטים פנויים בקטגוריה הזו. אפשר לבחור קטגוריה אחרת, להחזיר פריט מהחדר או לבקר בחנות.</p>
              ) : (
                <div className="thumb-grid">
                  {storageItems.map((f) => (
                    <button
                      key={f.id}
                      className="thumb-card"
                      onClick={() => {
                        const existing=room.items.find(i=>i.itemId===f.id);if(existing){setSelected(existing.uid);setPlacing(false);setEditing(true);closeDrawer();return;}
                        const now = Date.now();
                        update((s) => placeFurniture(s, f.id, now));
                        setSelected(placedUid(now));setPlacing(true);setEditing(false);closeDrawer();
                        sfx.tap();
                        notify(`${f.name} בחדר! אפשר לגרור או להקיש על מקום חדש.`);
                      }}
                    >
                      <FurnitureThumb id={f.id} p={p} />
                      <span>{f.name}</span>
                      <span className="tag">
                        <Icon name={storageView==='room'?'edit':'plus'} size={14} /> {storageView==='room'?'לבחירה ועריכה':'לחדר'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button className="ghost" onClick={() => onGo('shop')}>
                <Icon name="bag" /> עוד רהיטים בחנות
              </button>
            </div>
          )}

          {tab === 'walls' && (
            <div className="stack">
              {activeRoom!=='garden'&&<>
              <h3>קיר</h3>
              <div className="chips">
                {BACKGROUNDS.filter((b) => b.type === 'wall').map((b) => {
                  const owned = save.owned.backgrounds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      className={`chip ${room.wall === b.id ? 'on' : ''}`}
                      disabled={!owned}
                      onClick={() => update((s) => ({ ...s, studio: { ...s.studio, wall: b.id } }))}
                      title={owned ? '' : 'אפשר לקנות בחנות'}
                    >
                      {!owned && <Icon name="lock" size={14} />} {b.name}
                    </button>
                  );
                })}
              </div>
              <h3>רצפה</h3>
              <div className="chips">
                {BACKGROUNDS.filter((b) => b.type === 'floor').map((b) => {
                  const owned = save.owned.backgrounds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      className={`chip ${room.floor === b.id ? 'on' : ''}`}
                      disabled={!owned}
                      onClick={() => update((s) => ({ ...s, studio: { ...s.studio, floor: b.id } }))}
                    >
                      {!owned && <Icon name="lock" size={14} />} {b.name}
                    </button>
                  );
                })}
              </div>
              </>}
              <h3>פלטת צבעים</h3>
              <div className="palette-grid compact">
                {PALETTES.map((pal) => (
                  <button
                    key={pal.id}
                    className={`palette-card ${save.profile.paletteId === pal.id ? 'on' : ''}`}
                    onClick={() => update((s) => ({ ...s, profile: { ...s.profile, paletteId: pal.id } }))}
                    aria-pressed={save.profile.paletteId === pal.id}
                  >
                    <span className="swatches" aria-hidden="true">
                      {[pal.wall, pal.wallAccent, pal.accent, pal.accent2].map((c) => (
                        <span key={c} style={{ background: c }} />
                      ))}
                    </span>
                    {pal.name}
                  </button>
                ))}
              </div>
              <p className="muted small">קירות ורצפות נוספים מחכים בחנות.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
    )}</DesignWorkspace>
  );
}
