import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { DogFigure } from '../art/Dog';
import { FurnitureArt, FurnitureThumb } from '../art/Furniture';
import { FLOOR_Y, RoomBackground } from '../art/Scenes';
import { BACKGROUNDS, FURNITURE, furnitureById, PALETTES, paletteById, SWATCHES } from '../content/catalog';
import { dogById, STARTER_DOG_IDS } from '../content/dogs';
import type { Screen } from '../App';
import { moveDog, placedUid, placeFurniture, removePlaced, setStudioDog, updatePlaced } from '../state/game';
import { useStore } from '../state/store';
import type { PlacedItem } from '../state/types';
import { Icon } from '../ui/icons';
import { sfx } from '../ui/sound';
import { useToast } from '../ui/toast';
import { DesignWorkspace } from '../ui/DesignWorkspace';

const LAYER = { rug: 0, wall: 1, ceiling: 1, floor: 2 } as const;
const DOG_UID = '__dog__';
const DOG_SCALE = 0.48;

export function Studio({ onGo, hasClient }: { onGo: (s: Screen) => void; hasClient: boolean }) {
  const { save, update } = useStore();
  const notify = useToast();
  const p = paletteById(save.profile.paletteId);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ uid: string; dx: number; dy: number; x: number; y: number; moved: boolean } | null>(null);
  const [tab, setTab] = useState<'storage' | 'walls' | 'dog'>('storage');
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
    if (uid === DOG_UID) return save.studio.dog;
    const it = save.studio.items.find((i) => i.uid === uid);
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

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    const pos = posOf(selected);
    commitMove(selected, pos.x + dx, pos.y + dy);
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

  const sel = selected && selected !== DOG_UID ? save.studio.items.find((i) => i.uid === selected) : null;
  const items = [...save.studio.items].sort((a, b) => {
    const fa = furnitureById(a.itemId)!;
    const fb = furnitureById(b.itemId)!;
    return LAYER[fa.kind] - LAYER[fb.kind] || a.y - b.y;
  });
  const rugsAndWall = items.filter((i) => furnitureById(i.itemId)!.kind !== 'floor');
  const floorItems = items.filter((i) => furnitureById(i.itemId)!.kind === 'floor');
  const dogPos = posOf(DOG_UID);
  // floor items and the dog share depth ordering by y
  const depth: (PlacedItem | 'dog')[] = [...floorItems, 'dog'];
  depth.sort((a, b) => (a === 'dog' ? dogPos.y : posOf(a.uid).y) - (b === 'dog' ? dogPos.y : posOf(b.uid).y));

  const storageItems = FURNITURE.filter((f) => save.owned.furniture.includes(f.id) && !save.studio.items.some((i) => i.itemId === f.id));

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
    <DesignWorkspace title="עיצוב הסטודיו" bounds={{x:0,y:0,width:800,height:500}}>{({viewBox}) => (
    <div className="studio-screen">
      <section className="studio-stage card" aria-label="חדר הסטודיו">
        <div className="room-wrap">
          <svg
            ref={svgRef}
            className={`room ${selected ? 'placing' : ''}`}
            viewBox={viewBox}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onClick={onRoomClick}
            role="application"
            aria-label="אפשר לגרור פריטים, או להקיש על פריט ואז על מקום חדש"
          >
            <RoomBackground wall={save.studio.wall} floor={save.studio.floor} p={p} />
            <text x={780} y={FLOOR_Y - 284} textAnchor="end" fontSize={22} fontWeight={700} fill={p.accent} opacity={0.35} fontFamily="Rubik, Arial, sans-serif">
              {save.profile.studioName}
            </text>
            {rugsAndWall.map(renderItem)}
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

        {selected && (
          <div className="toolbar" role="toolbar" aria-label="עריכת פריט">
            <strong className="toolbar-title">{selected === DOG_UID ? ownDog.name : furnitureById(sel?.itemId ?? '')?.name}</strong>
            <span className="arrow-group" dir="ltr">
            <button className="icon-btn" onClick={() => nudge(-10, 0)} aria-label="שמאלה">
              <Icon name="arrowL" />
            </button>
            <button className="icon-btn" onClick={() => nudge(0, -10)} aria-label="למעלה">
              <Icon name="arrowU" />
            </button>
            <button className="icon-btn" onClick={() => nudge(0, 10)} aria-label="למטה">
              <Icon name="arrowD" />
            </button>
            <button className="icon-btn" onClick={() => nudge(10, 0)} aria-label="ימינה">
              <Icon name="arrowR" />
            </button>
            </span>
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
        {sel && (
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

      <aside className="studio-side">
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
            <button role="tab" aria-selected={tab === 'storage'} className={tab === 'storage' ? 'on' : ''} onClick={() => setTab('storage')}>
              המחסן שלי
            </button>
            <button role="tab" aria-selected={tab === 'walls'} className={tab === 'walls' ? 'on' : ''} onClick={() => setTab('walls')}>
              קירות, רצפה וצבעים
            </button>
            <button role="tab" aria-selected={tab === 'dog'} className={tab === 'dog' ? 'on' : ''} onClick={() => setTab('dog')}>
              כלב הסטודיו
            </button>
          </div>

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
                        notify(`${f.name} בחדר! אפשר לגרור או להזיז בחיצים.`);
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
              <h3>קיר</h3>
              <div className="chips">
                {BACKGROUNDS.filter((b) => b.type === 'wall').map((b) => {
                  const owned = save.owned.backgrounds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      className={`chip ${save.studio.wall === b.id ? 'on' : ''}`}
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
                      className={`chip ${save.studio.floor === b.id ? 'on' : ''}`}
                      disabled={!owned}
                      onClick={() => update((s) => ({ ...s, studio: { ...s.studio, floor: b.id } }))}
                    >
                      {!owned && <Icon name="lock" size={14} />} {b.name}
                    </button>
                  );
                })}
              </div>
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
