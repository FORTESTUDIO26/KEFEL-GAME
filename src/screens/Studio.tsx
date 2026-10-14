import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { DogFigure } from '../art/Dog';
import { FurnitureArt, FurnitureThumb } from '../art/Furniture';
import { FLOOR_Y } from '../art/Scenes';
import { RoomScenery } from '../art/WorldRooms';
import { getRoom, editRoom, ROOMS } from '../state/world';
import { RoomNavigation, RoomActivities, RoomOpening, RoomActivityScenery, WorldGameMenu } from '../ui/WorldRoomUI';
import { BACKGROUNDS, FURNITURE, furnitureById, PALETTES, paletteById, SWATCHES,WEARABLES,SLOT_LABEL,SLOT_ORDER,type Slot } from '../content/catalog';
import { dogById, STARTER_DOG_IDS } from '../content/dogs';
import type { Screen } from '../App';
import { moveDog, placedUid, placeFurniture, removePlaced, setStudioDog, updatePlaced,toggleItem,setOwnOutfit } from '../state/game';
import { WearableThumb } from '../ui/DressingRoom';
import { useStore } from '../state/store';
import type { SaveData, PlacedItem } from '../state/types';
import { Icon } from '../ui/icons';
import { sfx } from '../ui/sound';
import { useToast } from '../ui/toast';
import { DesignWorkspace } from '../ui/DesignWorkspace';

import { sceneOrder,changeLayer } from '../state/layers';
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
  const [selected, setSelected] = useState<string | null>(null);
  const [editing,setEditing]=useState(false);
  const [drag, setDrag] = useState<{ uid: string; dx: number; dy: number; x: number; y: number; moved: boolean } | null>(null);
  const [tab, setTab] = useState<'storage' | 'walls' | 'dog' | 'clothes'>('storage');
  const [clothesSlot,setClothesSlot]=useState<Slot>('body');
  useEffect(() => { setSelected(null); setDrag(null); }, [activeRoom]);
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

  const posOf = (uid: string) => {
    if (drag && drag.uid === uid) return { x: drag.x, y: drag.y };
    if (uid === DOG_UID) return room.dog;
    const it = room.items.find((i) => i.uid === uid);
    return it ? { x: it.x, y: it.y } : { x: 400, y: 400 };
  };

  const commitMove = (uid: string, x: number, y: number) => {
    update((s) => (uid === DOG_UID ? moveDog(s, x, y) : updatePlaced(s, uid, { x, y })));
    markMoved();
  };

  const onItemDown = (e: PointerEvent, uid: string) => {
    e.stopPropagation();
    const pt = toRoom(e.clientX, e.clientY);
    const pos = posOf(uid);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setSelected(uid);
    setEditing(false);
    setDrag({ uid, dx: pt.x - pos.x, dy: pt.y - pos.y, x: pos.x, y: pos.y, moved: false });
  };

  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    const pt = toRoom(e.clientX, e.clientY);
    const x = pt.x - drag.dx;
    const y = pt.y - drag.dy;
    const moved = drag.moved || Math.hypot(x - drag.x, y - drag.y) > 3;
    setDrag({ ...drag, x, y, moved });
  };

  const onUp = () => {
    if (drag?.moved) commitMove(drag.uid, drag.x, drag.y);
    setDrag(null);
  };

  /** Tap on an empty spot moves the selected item there (the click alternative to dragging). */
  const onRoomClick = (e: MouseEvent) => {
    if (!selected || drag) return;
    const pt = toRoom(e.clientX, e.clientY);
    commitMove(selected, pt.x, pt.y);
    sfx.tap();
  };

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

  const storageItems = FURNITURE.filter((f) => save.owned.furniture.includes(f.id) && !room.items.some((i) => i.itemId === f.id));

  const renderItem = (it: PlacedItem) => {
    const f = furnitureById(it.itemId)!;
    const pos = posOf(it.uid);
    const isSel = selected === it.uid;
    return (
      <g
        key={it.uid}
        className={`room-item ${isSel ? 'selected' : ''}`}
        transform={`translate(${pos.x} ${pos.y}) scale(${it.flip ? -it.scale : it.scale} ${it.scale})`}
        onPointerDown={(e) => onItemDown(e, it.uid)}
        onClick={(e) => e.stopPropagation()}
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
    <DesignWorkspace onTool={setTab} focusY={room.dog.y-90} title={ROOMS.find(r => r.id === activeRoom)?.name ?? "עיצוב הסטודיו"} navigation={<><RoomNavigation onSwitch={() => { setSelected(null); setDrag(null); }} /><RoomOpening /><WorldGameMenu onGo={onGo} /></>} bounds={{x:0,y:0,width:800,height:500}}>{({viewBox,closeDrawer,gesture}) => (
    <div className="studio-screen">
      <section className="studio-stage card" aria-label={ROOMS.find(r => r.id === activeRoom)?.name}>
        <div className="room-wrap">
          <svg
            ref={svgRef}
            className={`room ${selected ? 'placing' : ''}`}
            viewBox={viewBox}
            onPointerDownCapture={e=>{gesture.onPointerDownCapture(e);if(gesture.isCameraActive()){setDrag(null);e.stopPropagation();}}}
            onPointerMove={e=>{gesture.onPointerMove(e);if(gesture.isCameraActive())setDrag(null);else onMove(e);}}
            onPointerUp={e=>{gesture.onPointerUp(e);if(gesture.isCameraActive())setDrag(null);else onUp();}}
            onPointerCancel={e=>{gesture.onPointerCancel(e);setDrag(null);}}
            onClickCapture={gesture.onClickCapture}
            onClick={onRoomClick}
            role="application"
            aria-label="אפשר לגרור פריטים, או להקיש על פריט ואז על מקום חדש"
          >
            <RoomScenery id={activeRoom} wall={room.wall} floor={room.floor} p={p} />
            <text x={780} y={FLOOR_Y - 284} textAnchor="end" fontSize={22} fontWeight={700} fill={p.accent} opacity={0.35} fontFamily="Rubik, Arial, sans-serif">
              {save.profile.studioName}
            </text>
            <RoomActivityScenery roomId={activeRoom} />
            {depth.map((d) =>
              d === 'dog' ? (
                <g
                  key="dog"
                  className={`room-item ${selected === DOG_UID ? 'selected' : ''}`}
                  transform={`translate(${dogPos.x - 120 * DOG_SCALE} ${dogPos.y - 240 * DOG_SCALE}) scale(${DOG_SCALE})`}
                  onPointerDown={(e) => onItemDown(e, DOG_UID)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => onKey(e, DOG_UID)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${ownDog.name}, הכלב של הסטודיו`}
                >
                  <rect x={-40} y={-60} width={320} height={330} className="hit" />
                  <DogFigure dog={ownDog} outfit={save.outfits[ownDog.id]} asGroup />
                </g>
              ) : (
                renderItem(d)
              )
            )}
          </svg>
          {tipMove && (
            <p className="tip-bubble" role="note">
              <Icon name="sparkle" size={18} /> גררי רהיט כדי להזיז אותו — או הקישי עליו ואז על המקום החדש.
            </p>
          )}
        </div>

        <RoomActivities key={activeRoom} roomId={activeRoom} onGo={onGo} />
        {selected&&!editing&&<div className="item-context"><button className="hud-button" aria-label="עריכת הפריט הנבחר" onClick={()=>setEditing(true)}><Icon name="edit"/><span>עריכה</span></button><button className="hud-button" aria-label="ביטול בחירת פריט" onClick={()=>setSelected(null)}><Icon name="check"/><span>סיימתי</span></button></div>}
        {selected && editing && (
          <div className="toolbar" role="toolbar" aria-label="עריכת פריט">
            <strong className="toolbar-title">{selected === DOG_UID ? ownDog.name : furnitureById(sel?.itemId ?? '')?.name}</strong>
            <button className="secondary small" onClick={()=>update(s=>changeLayer(s,selected,'front'))}>לקדמה</button>
            <button className="secondary small" onClick={()=>update(s=>changeLayer(s,selected,'back'))}>לרקע</button>

            {sel && (
              <>
                <button className="icon-btn" onClick={() => update((s) => updatePlaced(s, sel.uid, { scale: sel.scale - 0.1 }))} aria-label="להקטין">
                  <Icon name="minus" />
                </button>
                <button className="icon-btn" onClick={() => update((s) => updatePlaced(s, sel.uid, { scale: sel.scale + 0.1 }))} aria-label="להגדיל">
                  <Icon name="plus" />
                </button>
                <button className="icon-btn" onClick={() => update((s) => updatePlaced(s, sel.uid, { flip: !sel.flip }))} aria-label="היפוך">
                  <Icon name="flip" />
                </button>
                <button
                  className="secondary small"
                  onClick={() => {
                    update((s) => removePlaced(s, sel.uid));
                    setSelected(null);
                    notify('הפריט חזר למחסן');
                  }}
                >
                  למחסן
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
        {sel && editing && (
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
        <h3 className="drawer-heading">{{storage:'המחסן שלי',clothes:'בגדים ואביזרים',walls:'צבעים ועיצוב',dog:'כלב הסטודיו'}[tab]}</h3>
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
              {activeRoom==='garden'?'צבעי הגינה':'קירות, רצפה וצבעים'}
            </button>
            <button role="tab" aria-selected={tab === 'dog'} className={tab === 'dog' ? 'on' : ''} onClick={() => setTab('dog')}>
              כלב הסטודיו
            </button>
          </div>
          {tab==='clothes'&&<div className="stack room-clothes"><p className="muted small">בחרי פריט כדי להלביש את {ownDog.name}. לחיצה נוספת מסירה אותו.</p><div className="chips">{SLOT_ORDER.map(slot=><button key={slot} className={`chip ${clothesSlot===slot?'on':''}`} aria-pressed={clothesSlot===slot} onClick={()=>setClothesSlot(slot)}>{SLOT_LABEL[slot]}</button>)}</div><div className="thumb-grid">{WEARABLES.filter(w=>w.slot===clothesSlot&&save.owned.wearables.includes(w.id)).map(w=><button key={w.id} className={`thumb-card ${save.outfits[ownDog.id]?.[w.slot]?.itemId===w.id?'on':''}`} aria-pressed={save.outfits[ownDog.id]?.[w.slot]?.itemId===w.id} aria-label={w.name} onClick={()=>updateSave(s=>setOwnOutfit(s,ownDog.id,toggleItem(s.outfits[ownDog.id]??{},w.id)))}><WearableThumb dog={ownDog} item={w}/><span>{w.name}</span></button>)}</div><button className="secondary" onClick={()=>updateSave(s=>{const outfit={...s.outfits[ownDog.id]};delete outfit[clothesSlot];return setOwnOutfit(s,ownDog.id,outfit);})}>להסיר מהקטגוריה</button><button className="ghost" onClick={()=>onGo('wardrobe')}>מלתחה מלאה וצילום לאלבום</button></div>}

          {tab === 'dog' && (
            <div className="stack">
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
            <div className="stack">
              {storageItems.length === 0 ? (
                <p className="muted">כל הרהיטים שלך כבר בחדר. אפשר להחזיר פריט למחסן, או לקנות עוד בחנות.</p>
              ) : (
                <div className="thumb-grid">
                  {storageItems.map((f) => (
                    <button
                      key={f.id}
                      className="thumb-card"
                      onClick={() => {
                        const now = Date.now();
                        update((s) => placeFurniture(s, f.id, now));
                        setSelected(placedUid(now));
                        sfx.tap();
                        notify(`${f.name} בחדר! אפשר לגרור או להקיש על מקום חדש.`);
                      }}
                    >
                      <FurnitureThumb id={f.id} p={p} />
                      <span>{f.name}</span>
                      <span className="tag">
                        <Icon name="plus" size={14} /> לחדר
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
