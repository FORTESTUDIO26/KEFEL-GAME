import { unlockBackgroundMusic } from '../ui/MusicPlayback';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { DogFigure,type DogMood } from '../art/Dog';
import { FurnitureArt, FurnitureThumb } from '../art/Furniture';
import { FLOOR_Y } from '../art/Scenes';
import { RoomScenery } from '../art/WorldRooms';
import { getRoom, editRoom, ROOMS } from '../state/world';
import { RoomNavigation, RoomActivities, RoomOpening, RoomActivityScenery } from '../ui/WorldRoomUI';
import { playStatus } from '../state/playTime';
import { chooseLearnSet } from '../learning/learnPath';
import { startBirthday } from '../state/birthday';
import { minutesLabel } from './Home';
import { BACKGROUNDS, FURNITURE, furnitureById, furnitureCategory, PALETTES, paletteById, SWATCHES,WEARABLES,SLOT_LABEL,SLOT_ORDER,type Slot } from '../content/catalog';
import { dogById, STARTER_DOG_IDS } from '../content/dogs';
import type { Screen } from '../App';
import { placedUid, placeFurniture, removePlaced, setStudioDog, startLearnSession, updatePlaced,toggleItem,setOwnOutfit } from '../state/game';
import { WearableThumb } from '../ui/DressingRoom';
import { useStore } from '../state/store';
import type { SaveData, PlacedItem } from '../state/types';
import { Icon } from '../ui/icons';
import { CoinAmount } from '../ui/common';
import { SurfaceSwatch } from '../ui/SurfaceSwatch';
import { RoomSurprise } from '../ui/RoomSurprise';
import { DOG_MAX_X, DOG_MIN_X, ITEM_MAX_X, ITEM_MIN_X, ROOM_W, ROOM_X0 } from '../art/roomSpan';
import { isSwitch, isWateringCan, itemState, setCanPouring, tapSwitch, waterPlantsNear } from '../state/interact';
import { sfx,setSoundEnabled } from '../ui/sound';
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

const STORAGE_CATEGORIES:[string,string][]=[['all','הכול'],['seating','ספות וכורסאות'],['storage','ארונות ומדפים'],['decor','קישוטים'],['textiles','שטיחים וכריות'],['lighting','תאורה'],['kitchen','מטבח וכלים'],['bath','רחצה'],['yard','חצר']];

export function Studio({ onGo, hasClient }: { onGo: (s: Screen) => void; hasClient: boolean }) {
  const { save, update: updateSave } = useStore();
  const activeRoom = save.world.activeRoom;
  const room = getRoom(save, activeRoom);
  const update = (fn: (s: SaveData) => SaveData) => updateSave(s => editRoom(s, activeRoom, fn));
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
  /** the learn button starts (or continues) a lesson right away */
  const startLesson = () => { if (!learning && chooseLearnSet(save.learning, save.settings.tables).length > 0) updateSave((s) => (s.learning.learnSession ? s : startLearnSession(s, Date.now()))); onGo('learn'); };
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
   update(s=>{const drop=resolveDrop(s.studio,uid,{x,y});drop.x=Math.max(uid===DOG_UID?DOG_MIN_X:ITEM_MIN_X,Math.min(uid===DOG_UID?DOG_MAX_X:ITEM_MAX_X,drop.x));drop.y=Math.max(uid===DOG_UID&&!drop.supportUid?340:0,Math.min(uid===DOG_UID?495:500,drop.y));const moved=moveWithSupports(s,uid,drop.x,drop.y);return uid===DOG_UID?{...moved,studio:{...moved.studio,dog:{...moved.studio.dog,supportUid:drop.supportUid}}}:{...moved,studio:{...moved.studio,items:moved.studio.items.map(item=>item.uid===uid?{...item,supportUid:drop.supportUid}:item)}};});
   markMoved();
  };

  /** the watering can tilts and pours where it stands; plants close to it drink and grow */
  const pourTimer=useRef<ReturnType<typeof setTimeout>>();
  useEffect(()=>()=>clearTimeout(pourTimer.current),[]);
  const pour=(uid:string,at:{x:number;y:number})=>{
   update(s=>setCanPouring(s,uid,true));sfx.splash();
   clearTimeout(pourTimer.current);
   pourTimer.current=setTimeout(()=>{let grew=0;update(s=>{const r=waterPlantsNear(setCanPouring(s,uid,false),at);grew=r.watered;return r.save;});if(grew)sfx.grow();},1400);
  };
  /** the camera, filled in from the workspace render (pan + what is visible) */
  const cam=useRef<{panBy:(dx:number)=>void;centerX:number}>({panBy:()=>{},centerX:400});
  /** dragging an item near a screen edge scrolls the room that way, so items travel the whole room */
  const edge=useRef<{raf:number|null;x:number;y:number;pid:number}>({raf:null,x:0,y:0,pid:0});
  const stopEdge=()=>{if(edge.current.raf!==null)clearTimeout(edge.current.raf);edge.current.raf=null;};
  useEffect(()=>stopEdge,[]);
  const edgeStep=()=>{
   edge.current.raf=null;
   const d=dragLive.current,svg=svgRef.current;if(!d||!d.moved||!svg)return;
   const r=svg.getBoundingClientRect();const zone=Math.max(70,r.width*0.12);
   const {x,y,pid}=edge.current;
   const depth=x<r.left+zone?-(r.left+zone-x):x>r.right-zone?x-(r.right-zone):0;
   if(!depth)return;
   cam.current.panBy(Math.sign(depth)*Math.min(1,Math.abs(depth)/zone)*16);
   // the pointer stays still, the room moves under it: re-place the item at the pointer
   window.setTimeout(()=>{const cur=dragLive.current;if(!cur)return;const next=advanceItemDrag(cur,pid,toRoom(x,y));dragLive.current=next;setDrag(next);},0);
   edge.current.raf=window.setTimeout(edgeStep,16);
  };
  const onItemDown=(e:PointerEvent,uid:string)=>{
   if(e.button!==0)return;e.stopPropagation();
   const d=beginItemDrag(uid,e.pointerId,toRoom(e.clientX,e.clientY),posOf(uid));
   dragLive.current=d;setDrag(d);setSelected(uid);setEditing(false);setPlacing(false);if(uid===DOG_UID){setDogMood('idle');setDogCaption('');}
   svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove=(e:PointerEvent)=>{const d=dragLive.current;if(!d)return;edge.current.x=e.clientX;edge.current.y=e.clientY;edge.current.pid=e.pointerId;if(edge.current.raf===null)edge.current.raf=window.setTimeout(edgeStep,16);const next=advanceItemDrag(d,e.pointerId,toRoom(e.clientX,e.clientY));dragLive.current=next;if(dragFrame.current===null)dragFrame.current=requestAnimationFrame(()=>{dragFrame.current=null;setDrag(dragLive.current);});};
  const onUp=(e:PointerEvent)=>{stopEdge();const result=finishItemDrag(dragLive.current,e.pointerId,toRoom(e.clientX,e.clientY));if(!result)return;skipClick.current=true;const hit=room.items.find(i=>i.uid===result.uid);if(result.moved){commitMove(result.uid,result.x,result.y);setSelected(null);setEditing(false);setPlacing(false);if(isWateringCan(hit))pour(result.uid,resolveDrop(room,result.uid,{x:result.x,y:result.y}));}else if(isWateringCan(hit)){pour(result.uid,{x:hit!.x,y:hit!.y});}else if(hit&&isSwitch(hit)){update(s=>tapSwitch(s,hit.uid)??s);const on=itemState(hit)==='off';if(on&&/sink|basin/.test(hit.itemId))sfx.splash();else sfx.click();}else if(result.uid===DOG_UID){reactDog('pet','איזה כיף שאת כאן!');sfx.gentle();}else if(room.items.find(i=>i.uid===result.uid)?.itemId.startsWith(GUEST_PREFIX)){reactGuest(result.uid,'wag');sfx.gentle();}clearDrag();};
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
        <FurnitureArt id={it.itemId} p={p} color={it.color} state={itemState(it)} />
      </g>
    );
  };

  return (
    <DesignWorkspace sound={save.settings.sound} onToggleSound={()=>{const next=!save.settings.sound;setSoundEnabled(next);if(next){unlockBackgroundMusic();sfx.tap();}updateSave(s=>({...s,settings:{...s.settings,sound:next}}));}} onTool={setTab} focusY={250} title={ROOMS.find(r => r.id === activeRoom)?.name ?? "עיצוב הסטודיו"} navigation={<><RoomNavigation onSwitch={() => { setSelected(null); setDrag(null); }} /><RoomOpening onGo={onGo} /><nav className="world-game-nav" aria-label="למידה"><button className="hud-button learn-hud" onClick={startLesson} aria-label={learning ? 'להמשיך את השיעור' : 'ללמוד'} title={learning ? 'להמשיך את השיעור' : 'ללמוד'}><Icon name="sparkle" size={26}/><span>{learning ? 'להמשיך' : 'ללמוד'}</span></button></nav>{save.birthday.active&&<BirthdayStory onGo={onGo}/>}</>} hudEnd={<><span className="coins-pill room-coins" aria-label={`${save.coins} מטבעות`} title="מטבעות"><CoinAmount value={save.coins} /></span><PlayTimerChip /><button className="hud-button parent-hud" aria-label="להורים: נתוני למידה, זמן, הגדרות וגיבוי (לחיצה ארוכה)" onClick={()=>onGo('parent')}><Icon name="lock" size={24}/><span>להורים</span></button></>} toolbarExtra={<><button className="bar-button" onClick={()=>onGo('shop')} aria-label="חנות" title="חנות"><Icon name="bag" size={22}/><span>חנות</span></button><StudioMore onGo={onGo} hasClient={hasClient} /></>} bounds={{x:ROOM_X0,y:0,width:ROOM_W,height:500,horizontal:true}}>{({viewBox,closeDrawer,gesture,onCameraKey,panBy}) => {
    {const [vx,,vw]=viewBox.split(' ').map(Number);cam.current={panBy,centerX:vx+vw/2};}
    return (
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
          <RoomSurprise hidden={!!selected} />
          {placing&&<p className="placing-instruction" role="status">הקישי בחדר כדי להניח כאן את הפריט</p>}
          {tipMove && (
            <p className="tip-bubble" role="note">
              <Icon name="sparkle" size={18} /> גררי פריט כדי להזיז אותו. נגיעה ברקע משחררת את הבחירה.
            </p>
          )}
        </div>

        {dogCaption&&<p className="dog-reaction-caption" role="status">{ownDog.name}: {dogCaption}</p>}
        <RoomActivities key={activeRoom} roomId={activeRoom} onGo={onGo} />
        {selected&&!editing&&<div className="item-context"><button className="hud-button" aria-label="עריכת הפריט הנבחר" onClick={()=>setEditing(true)}><Icon name="edit"/><span>עריכה</span></button><button className="hud-button" aria-label="ביטול בחירת פריט" onClick={()=>setSelected(null)}><Icon name="check"/><span>סיימתי</span></button></div>}
        {selected && editing && (
          <div className="toolbar" role="toolbar" aria-label="עריכת פריט">
            <button className="icon-btn" aria-label="בחירת מיקום בלחיצה" title="מיקום" onClick={()=>{setPlacing(true);setEditing(false);}}><Icon name="pin" /></button>
            <strong className="toolbar-title sr-only">{selected === DOG_UID ? ownDog.name : furnitureById(sel?.itemId ?? '')?.name ?? characterName(sel?.itemId ?? '')}</strong>
            <button className="icon-btn" aria-label="לקדמה" title="לקדמה" onClick={()=>update(s=>changeLayer(s,selected,'front'))}><Icon name="arrowU" /></button>
            <button className="icon-btn" aria-label="לרקע" title="לרקע" onClick={()=>update(s=>changeLayer(s,selected,'back'))}><Icon name="arrowD" /></button>

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
                  className="icon-btn"
                  aria-label={characterOf(sel.itemId) ? 'להוציא מהחדר' : 'למחסן'}
                  title={characterOf(sel.itemId) ? 'להוציא' : 'למחסן'}
                  onClick={() => {
                    update((s) => removePlaced(s, sel.uid));
                    setSelected(null);
                  }}
                >
                  <Icon name={characterOf(sel.itemId) ? 'close' : 'box'} />
                </button>
              </>
            )}
            {selected === DOG_UID && (
              <button className="icon-btn" aria-label="להלביש" title="להלביש" onClick={() => onGo('wardrobe')}>
                <Icon name="hanger" />
              </button>
            )}
            <button className="icon-btn done-btn" aria-label="סיימתי" title="סיימתי" onClick={() => setSelected(null)}>
              <Icon name="check" />
            </button>
          </div>
        )}
        {sel && editing && characterOf(sel.itemId)?.kind === 'human' && (
          <div className="human-dresser" role="group" aria-label={`בגדים ל${characterName(sel.itemId)}`}>
            <div className="chips">{(Object.keys(HUMAN_SLOT_LABEL) as HumanSlot[]).map(slot=><button key={slot} className={`chip ${humanSlot===slot?'on':''}`} aria-pressed={humanSlot===slot} onClick={()=>setHumanSlot(slot)}>{HUMAN_SLOT_LABEL[slot]}</button>)}</div>
            <div className="chips">{HUMAN_WEARABLES.filter(w=>w.slot===humanSlot).map(w=>{const cur=(sel.outfit??humanById(characterOf(sel.itemId)!.id)!.defaultOutfit)[humanSlot]?.itemId===w.id;return <button key={w.id} className={`chip ${cur?'on':''}`} aria-pressed={cur} aria-label={w.name} title={w.name} onClick={()=>update(s=>setHumanOutfit(s,sel.uid,humanSlot,cur?null:w.id))}><span className="swatch-dot" style={{background:w.color}} aria-hidden="true"/></button>;})}</div>
          </div>
        )}
        {sel && editing && !characterOf(sel.itemId) && (
          <div className="swatch-row toolbar-colors" role="group" aria-label="צבע הפריט">
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
        <h3 className="drawer-heading sr-only">{{storage:'רהיטים',clothes:'בגדים ואביזרים',walls:activeRoom==='garden'?'צבעי הגינה':'צבעים וקירות',dog:'דמויות'}[tab]}</h3>
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
          {tab==='clothes'&&<div className="stack room-clothes item-menu">
            <div className="item-tabs" role="tablist" aria-label="סוג הבגד">{SLOT_ORDER.map(slot=>{const first=WEARABLES.find(w=>w.slot===slot);return <button key={slot} role="tab" className={`item-tab ${clothesSlot===slot?'on':''}`} aria-selected={clothesSlot===slot} aria-label={SLOT_LABEL[slot]} title={SLOT_LABEL[slot]} onClick={()=>setClothesSlot(slot)}>{first?<WearableThumb dog={ownDog} item={first}/>:<Icon name="hanger"/>}</button>;})}</div>
            <div className="thumb-grid item-grid">
              <button className="thumb-card item-tool" aria-label="להסיר את הבגד מהקטגוריה" title="להסיר" onClick={()=>updateSave(s=>{const outfit={...s.outfits[ownDog.id]};delete outfit[clothesSlot];return setOwnOutfit(s,ownDog.id,outfit);})}><Icon name="close" size={30}/></button>
              {WEARABLES.filter(w=>w.slot===clothesSlot&&save.owned.wearables.includes(w.id)).map(w=><button key={w.id} className={`thumb-card ${save.outfits[ownDog.id]?.[w.slot]?.itemId===w.id?'on':''}`} aria-pressed={save.outfits[ownDog.id]?.[w.slot]?.itemId===w.id} aria-label={w.name} title={w.name} onClick={()=>updateSave(s=>setOwnOutfit(s,ownDog.id,toggleItem(s.outfits[ownDog.id]??{},w.id)))}><WearableThumb dog={ownDog} item={w}/></button>)}
              <button className="thumb-card item-tool" aria-label="מלתחה מלאה וצילום לאלבום" title="מלתחה" onClick={()=>onGo('wardrobe')}><Icon name="camera" size={30}/></button>
            </div>
          </div>}

          {tab === 'dog' && (
            <div className="stack item-menu">
              <div className="thumb-grid item-grid char-grid">
                {FAMILY.map((m) => {
                  const id = FAMILY_PREFIX + m.id;
                  const here = room.items.find((i) => i.itemId === id);
                  return (
                    <button key={id} className={`thumb-card guest-pick ${here ? 'on' : ''}`} aria-pressed={!!here} aria-label={`${m.name}${here ? ' · בחדר, להוציא' : ''}`} title={m.name} disabled={!here && charactersIn(room.items).length >= MAX_CHARACTERS}
                      onClick={() => { if (here) { update((s) => removePlaced(s, here.uid)); } else { const now = Date.now(); update((s) => addCharacter(s, id, now, cam.current.centerX)); sfx.tap(); } }}>
                      <img src={m.src} alt="" className="family-thumb" />
                    </button>
                  );
                })}
                {HUMANS.map((h) => {
                  const id = HUMAN_PREFIX + h.id;
                  const here = room.items.find((i) => i.itemId === id);
                  return (
                    <button key={id} className={`thumb-card guest-pick ${here ? 'on' : ''}`} aria-pressed={!!here} aria-label={`${h.name}${here ? ' · בחדר, להוציא' : ''}`} title={h.name} disabled={!here && charactersIn(room.items).length >= MAX_CHARACTERS}
                      onClick={() => { if (here) { update((s) => removePlaced(s, here.uid)); } else { const now = Date.now(); update((s) => addCharacter(s, id, now, cam.current.centerX)); sfx.tap(); } }}>
                      <HumanFigure human={h} />
                    </button>
                  );
                })}
                {STARTER_DOG_IDS.filter((id) => id !== save.profile.ownDogId).map((id) => {
                  const d = dogById(id);
                  const gid = GUEST_PREFIX + id;
                  const here = room.items.find((i) => i.itemId === gid);
                  return (
                    <button key={gid} className={`thumb-card guest-pick ${here ? 'on' : ''}`} aria-pressed={!!here} aria-label={`${d.name}${here ? ' · בחדר, להוציא' : ''}`} title={d.name} disabled={!here && charactersIn(room.items).length >= MAX_CHARACTERS}
                      onClick={() => { if (here) { update((s) => removePlaced(s, here.uid)); } else { const now = Date.now(); update((s) => addCharacter(s, gid, now, cam.current.centerX)); sfx.tap(); } }}>
                      <DogFigure dog={d} outfit={save.outfits[id]} />
                    </button>
                  );
                })}
              </div>
              <div className="item-divider" aria-hidden="true"><Icon name="home" size={20} /></div>
              <div className="thumb-grid item-grid char-grid" role="group" aria-label="הכלב שגר בסטודיו">
                {STARTER_DOG_IDS.map((id) => {
                  const d = dogById(id);
                  const on = save.profile.ownDogId === id;
                  return (
                    <button key={id} className={`thumb-card dog-pick ${on ? 'on' : ''}`} aria-pressed={on} aria-label={`${d.name} גר בסטודיו`} title={d.name}
                      onClick={() => { update((s) => setStudioDog(s, id)); sfx.tap(); }}>
                      <DogFigure dog={d} outfit={save.outfits[id]} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'storage' && (
            <div className="stack item-menu">
              <div className="item-tabs" role="tablist" aria-label="קטגוריות">
                <button role="tab" className={`item-tab ${storageView==='stored'?'on':''}`} aria-selected={storageView==='stored'} aria-label="במחסן" title="במחסן" onClick={()=>setStorageView('stored')}><Icon name="box"/></button>
                <button role="tab" className={`item-tab ${storageView==='room'?'on':''}`} aria-selected={storageView==='room'} aria-label="בחדר: בחירה ועריכה" title="בחדר" onClick={()=>setStorageView('room')}><Icon name="home"/></button>
                <span className="item-tabs-gap" aria-hidden="true" />
                {STORAGE_CATEGORIES.map(([id,label])=>{const n=availableItems.filter(f=>id==='all'||furnitureCategory(f)===id).length;const rep=FURNITURE.find(f=>!f.baseId&&furnitureCategory(f)===id);return <button key={id} role="tab" className={`item-tab ${storageCategory===id?'on':''}`} aria-selected={storageCategory===id} aria-label={`${label} (${n})`} title={label} disabled={n===0&&storageCategory!==id} onClick={()=>setStorageCategory(id)}>{id==='all'||!rep?<Icon name="grid"/>:<FurnitureThumb id={rep.id} p={p} />}</button>;})}
              </div>
              <div className="thumb-grid item-grid">
                {storageItems.map((f) => (
                  <button
                    key={f.id}
                    className="thumb-card"
                    aria-label={f.name}
                    title={f.name}
                    onClick={() => {
                      const existing=room.items.find(i=>i.itemId===f.id);if(existing){setSelected(existing.uid);setPlacing(false);setEditing(true);closeDrawer();return;}
                      const now = Date.now();
                      update((s) => placeFurniture(s, f.id, now, cam.current.centerX));
                      setSelected(placedUid(now));setPlacing(true);setEditing(false);closeDrawer();
                      sfx.tap();
                    }}
                  >
                    <FurnitureThumb id={f.id} p={p} />
                  </button>
                ))}
                <button className="thumb-card item-tool shop-tile" aria-label="עוד רהיטים בחנות" title="חנות" onClick={() => onGo('shop')}><Icon name="bag" size={30} /></button>
              </div>
            </div>
          )}

          {tab === 'walls' && (
            <div className="stack item-menu">
              {activeRoom!=='garden'&&<>
              <div className="item-divider" aria-hidden="true"><Icon name="wall" size={20} /></div>
              <div className="thumb-grid item-grid swatch-grid" role="group" aria-label="קיר">
                {BACKGROUNDS.filter((b) => b.type === 'wall').map((b) => {
                  const owned = save.owned.backgrounds.includes(b.id);
                  return (
                    <button key={b.id} className={`thumb-card surface-tile ${room.wall === b.id ? 'on' : ''}`} disabled={!owned} aria-pressed={room.wall === b.id} aria-label={owned ? b.name : `${b.name} (בחנות)`} title={b.name}
                      onClick={() => update((s) => ({ ...s, studio: { ...s.studio, wall: b.id } }))}>
                      <SurfaceSwatch bg={b} p={p} />{!owned && <span className="lock-badge"><Icon name="lock" size={14} /></span>}
                    </button>
                  );
                })}
              </div>
              <div className="item-divider" aria-hidden="true"><Icon name="floor" size={20} /></div>
              <div className="thumb-grid item-grid swatch-grid" role="group" aria-label="רצפה">
                {BACKGROUNDS.filter((b) => b.type === 'floor').map((b) => {
                  const owned = save.owned.backgrounds.includes(b.id);
                  return (
                    <button key={b.id} className={`thumb-card surface-tile ${room.floor === b.id ? 'on' : ''}`} disabled={!owned} aria-pressed={room.floor === b.id} aria-label={owned ? b.name : `${b.name} (בחנות)`} title={b.name}
                      onClick={() => update((s) => ({ ...s, studio: { ...s.studio, floor: b.id } }))}>
                      <SurfaceSwatch bg={b} p={p} />{!owned && <span className="lock-badge"><Icon name="lock" size={14} /></span>}
                    </button>
                  );
                })}
              </div>
              </>}
              <div className="item-divider" aria-hidden="true"><Icon name="brush" size={20} /></div>
              <div className="thumb-grid item-grid swatch-grid" role="group" aria-label="פלטת צבעים">
                {PALETTES.map((pal) => (
                  <button key={pal.id} className={`thumb-card palette-tile ${save.profile.paletteId === pal.id ? 'on' : ''}`} aria-pressed={save.profile.paletteId === pal.id} aria-label={pal.name} title={pal.name}
                    onClick={() => update((s) => ({ ...s, profile: { ...s.profile, paletteId: pal.id } }))}>
                    <span className="swatches" aria-hidden="true">
                      {[pal.wall, pal.wallAccent, pal.accent, pal.accent2].map((c, i) => (<span key={i} style={{ background: c }} />))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
    );}}</DesignWorkspace>
  );
}

/** Design time left, always visible while designing (hidden when parents turned the limit off). */
function PlayTimerChip() {
  const { save } = useStore();
  const st = playStatus(save.playTime);
  if (!st.limited) return null;
  return (
    <span className={`play-timer ${st.warn ? 'warn' : ''}`} role="timer" aria-live="off" aria-label={`זמן עיצוב שנשאר: ${minutesLabel(st.remainingMs)}`}>
      <Icon name="clock" size={18} /> {st.locked ? 'הזמן נגמר' : `עוד ${minutesLabel(st.remainingMs)}`}
    </span>
  );
}

/** Everything that is not designing itself: wardrobe, album, clients, music, the birthday story, home. */
function StudioMore({ onGo, hasClient }: { onGo: (s: Screen) => void; hasClient: boolean }) {
  const { save, update } = useStore();
  const b = save.birthday;
  const toggleSound = () => { const next = !save.settings.sound; setSoundEnabled(next); if (next) { unlockBackgroundMusic(); sfx.tap(); } update((s) => ({ ...s, settings: { ...s.settings, sound: next } })); };
  const close = (e: { currentTarget: Element }) => { const d = e.currentTarget.closest('details'); if (d) d.open = false; };
  return (
    <details className="room-more">
      <summary className="bar-button" aria-label="עוד"><Icon name="menu" size={22} /><span>עוד</span></summary>
      <div className="room-more-panel" role="group" aria-label="עוד">
        <button className="secondary" onClick={() => onGo('wardrobe')}><Icon name="hanger" /> מלתחה</button>
        <button className="secondary" onClick={() => onGo('album')}><Icon name="album" /> אלבום</button>
        <button className="secondary" onClick={() => onGo('client')}><Icon name="paw" /> {hasClient ? 'הלקוח מחכה' : 'לקוחות'}</button>
        {!b.active && b.stage !== 'done' && <button className="secondary" onClick={(e) => { close(e); update(startBirthday); }}><Icon name="star" /> {b.stage === 'invite' ? 'יום ההולדת של לולה' : 'ממשיכות את יום ההולדת'}</button>}
        <button className="secondary" aria-pressed={!save.settings.sound} onClick={(e) => { close(e); toggleSound(); }}><Icon name={save.settings.sound ? 'sound' : 'mute'} /> {save.settings.sound ? 'להשתיק מנגינה' : 'להפעיל מנגינה'}</button>
        <button className="ghost" onClick={() => onGo('home')}><Icon name="home" /> למסך הבית</button>
      </div>
    </details>
  );
}
