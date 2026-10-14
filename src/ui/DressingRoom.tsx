import { useRef, useState } from 'react';
import { DogFigure, rigFor } from '../art/Dog';
import { SLOT_LABEL, SLOT_ORDER, SWATCHES, WEARABLES, type Direction, type Slot, type Wearable } from '../content/catalog';
import type { DogDef } from '../content/dogs';
import { styleStars } from '../state/economy';
import { toggleItem } from '../state/game';
import { useStore } from '../state/store';
import type { Outfit } from '../state/types';
import { BuyDialog } from './BuyDialog';
import { CoinAmount, Stars } from './common';
import { Icon, type IconName } from './icons';
import { sfx } from './sound';
import { DesignWorkspace } from './DesignWorkspace';

/** The dog wearing a single item, cropped to where the item sits. */
export function WearableThumb({ dog, item, color }: { dog: DogDef; item: Wearable; color?: string }) {
  const r = rigFor(dog);
  const R = r.headR;
  const box: Record<Slot, [number, number, number, number]> = {
    head: [r.cx - R * 1.7, r.headCy - R * 2.5, R * 3.4, R * 2.9],
    eyes: [r.cx - R * 1.15, r.headCy - R * 0.85, R * 2.3, R * 1.6],
    neck: [r.cx - 75, r.neckY - 55, 150, 125],
    body: [r.cx - r.bw - 40, r.bodyTop - 30, 2 * r.bw + 80, r.bottom - r.bodyTop + 55],
    feet: [r.cx - 70, r.legTop - 10, 140, r.bottom - r.legTop + 30],
    back: [-30, -10, 300, 270],
    prop: [-40, -60, 320, 330],
  };
  const [x, y, w, h] = box[item.slot];
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={item.name}>
      <DogFigure dog={dog} outfit={{ [item.slot]: { itemId: item.id, color: color ?? item.color } }} asGroup />
    </svg>
  );
}

type Care = 'brush' | 'treat' | 'bath';
const CARE: { id: Care; label: string; icon: IconName; line: string }[] = [
  { id: 'brush', label: 'לסרק', icon: 'brush', line: 'הפרווה מבריקה!' },
  { id: 'treat', label: 'חטיף', icon: 'bone', line: 'אממ, טעים!' },
  { id: 'bath', label: 'בועות', icon: 'bubbles', line: 'נקי וריחני!' },
];

interface Props {
  dog: DogDef;
  outfit: Outfit;
  onChange: (o: Outfit) => void;
  direction?: Direction | null;
}

export function DressingRoom({ dog, outfit, onChange, direction }: Props) {
  const { save } = useStore();
  const [slot, setSlot] = useState<Slot>('body');
  const [history, setHistory] = useState<Outfit[]>([]);
  const [care, setCare] = useState<{ id: Care; n: number } | null>(null);
  const [buying, setBuying] = useState<Wearable | null>(null);
  const closedAt = useRef(0);
  const tipKey = 'dress-tap';
  const showTip = !save.tips.includes(tipKey) && Object.keys(outfit).length === 0;

  const change = (next: Outfit) => {
    setHistory((h) => [...h.slice(-20), outfit]);
    onChange(next);
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
  };

  const items = WEARABLES.filter((w) => w.slot === slot);
  const owned = items.filter((w) => save.owned.wearables.includes(w.id));
  const locked = items.filter((w) => !save.owned.wearables.includes(w.id));
  const current = outfit[slot];
  const stars = styleStars(outfit, direction ?? null);
  const fits = (w: Wearable) => !!direction && w.tags.some((t) => direction.tags.includes(t));

  return (
    <DesignWorkspace title={`להלביש את ${dog.name}`} bounds={{x:-40,y:-60,width:320,height:330}}>{({viewBox}) => (
    <div className="dress">
      <div className="dress-stage card">
        <div className={`dress-dog care-${care?.id ?? 'none'}`} key={care?.n}>
          <svg viewBox={viewBox} role="img" aria-label={`${dog.name}, ${dog.breed}`}><DogFigure dog={dog} outfit={outfit} asGroup /></svg>
          {care && (
            <div className="care-fx" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`fx fx-${i}`}>
                  <Icon name={care.id === 'treat' ? 'heart' : care.id === 'bath' ? 'bubbles' : 'sparkle'} size={26} />
                </span>
              ))}
            </div>
          )}
        </div>
        {care && (
          <p className="speech center" role="status">
            {dog.name}: {CARE.find((c) => c.id === care.id)?.line}
          </p>
        )}
        {direction && (
          <div className="direction-meter">
            <span>
              התאמה לכיוון <strong>״{direction.name}״</strong>
            </span>
            <Stars n={stars} />
          </div>
        )}
        <div className="care-row" role="group" aria-label="פינוק">
          {CARE.map((c) => (
            <button
              key={c.id}
              className="care-btn"
              onClick={() => {
                sfx.tap();
                setCare({ id: c.id, n: Date.now() });
              }}
            >
              <Icon name={c.icon} /> {c.label}
            </button>
          ))}
        </div>
        <div className="row">
          <button className="ghost small" onClick={undo} disabled={!history.length}>
            <Icon name="undo" /> ביטול
          </button>
          <button className="ghost small" onClick={() => change({})} disabled={!Object.keys(outfit).length}>
            <Icon name="trash" /> להוריד הכול
          </button>
        </div>
      </div>

      <div className="dress-panel card">
        <div className="slot-tabs" role="tablist" aria-label="סוגי פריטים">
          {SLOT_ORDER.map((s) => (
            <button key={s} role="tab" aria-selected={slot === s} className={`slot-tab ${slot === s ? 'on' : ''} ${outfit[s] ? 'worn' : ''}`} onClick={() => setSlot(s)}>
              {SLOT_LABEL[s]}
            </button>
          ))}
        </div>
        {showTip && (
          <p className="tip-bubble inline" role="note">
            <Icon name="sparkle" size={18} /> הקישי על פריט כדי להלביש. הקשה נוספת מורידה אותו.
          </p>
        )}
        <div className="item-grid">
          {owned.map((w) => {
            const on = current?.itemId === w.id;
            return (
              <button
                key={w.id}
                className={`item-card ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() => {
                  sfx.tap();
                  change(toggleItem(outfit, w.id));
                }}
              >
                <WearableThumb dog={dog} item={w} color={on ? current?.color : undefined} />
                <span className="item-name">{w.name}</span>
                {on && <span className="tag on-tag">נבחר · הקשה מסירה</span>}
                {!on && fits(w) && <span className="tag fit-tag">מתאים לבקשה</span>}
                {w.rg && <span className="tag rg-tag">התעמלות</span>}
              </button>
            );
          })}
          {locked.map((w) => (
            <button key={w.id} className="item-card locked" onClick={() => Date.now() - closedAt.current > 450 && setBuying(w)}>
              <WearableThumb dog={dog} item={w} />
              <span className="item-name">{w.name}</span>
              <span className="tag price-tag">
                <Icon name="lock" size={14} /> <CoinAmount value={w.price} size={16} />
              </span>
            </button>
          ))}
        </div>
        {current && (
          <div className="swatch-row" role="group" aria-label="צבע">
            <span className="muted small">צבע:</span>
            {SWATCHES.map((sw) => (
              <button
                key={sw.id}
                className={`swatch ${current.color === sw.hex ? 'on' : ''}`}
                style={{ background: sw.hex }}
                aria-label={sw.name}
                aria-pressed={current.color === sw.hex}
                onClick={() => change({ ...outfit, [slot]: { ...current, color: sw.hex } })}
              />
            ))}
          </div>
        )}
      </div>
      {buying && (
        <BuyDialog
          kind="wearable"
          id={buying.id}
          name={buying.name}
          preview={<WearableThumb dog={dog} item={buying} />}
          onClose={() => {
            closedAt.current = Date.now();
            setBuying(null);
          }}
        />
      )}
    </div>
    )}</DesignWorkspace>
  );
}
