import { useRef, useState, type ReactNode } from 'react';
import { FurnitureThumb } from '../art/Furniture';
import { BACKGROUNDS, FURNITURE, paletteById, WEARABLES, type ShopKind } from '../content/catalog';
import { dogById } from '../content/dogs';
import { canBuy, isOwned } from '../state/economy';
import { useStore } from '../state/store';
import { BuyDialog } from '../ui/BuyDialog';
import { CoinAmount } from '../ui/common';
import { WearableThumb } from '../ui/DressingRoom';
import { Icon } from '../ui/icons';
import { RoomBackground } from '../art/Scenes';

type Tab = 'clothes' | 'rg' | 'studio' | 'walls' | 'rare';

interface Entry {
  kind: ShopKind;
  id: string;
  name: string;
  rare?:boolean;
  price: number;
  preview: ReactNode;
}

export function Shop() {
  const { save } = useStore();
  const [tab, setTab] = useState<Tab>('clothes');
  const [buying, setBuying] = useState<Entry | null>(null);
  const [hideOwned, setHideOwned] = useState(false);
  const closedAt = useRef(0);
  const p = paletteById(save.profile.paletteId);
  const dog = dogById(save.profile.ownDogId);

  const wearable = (w: (typeof WEARABLES)[number]): Entry => ({ kind: 'wearable', id: w.id, name: w.name, price: w.price, rare:w.rare, preview: <WearableThumb dog={dog} item={w} /> });
  const furniture = (f: (typeof FURNITURE)[number]): Entry => ({ kind: 'furniture', id: f.id, name: f.name, price: f.price, rare:f.rare, preview: <FurnitureThumb id={f.id} p={p} /> });
  const background = (b: (typeof BACKGROUNDS)[number]): Entry => ({
    kind: 'background',
    id: b.id,
    name: b.name,
    price: b.price, rare:b.rare,
    preview: (
      <svg viewBox={b.type === 'wall' ? '0 60 300 200' : '0 300 300 200'} role="img" aria-label={b.name}>
        <RoomBackground wall={b.type === 'wall' ? b.id : 'wall_plain'} floor={b.type === 'floor' ? b.id : 'floor_wood'} p={p} />
      </svg>
    ),
  });

  const entries: Entry[] =
    tab === 'rare'? [...WEARABLES.filter(w=>w.rare).map(wearable),...FURNITURE.filter(f=>f.rare).map(furniture),...BACKGROUNDS.filter(b=>b.rare).map(background)]:tab === 'clothes'
      ? WEARABLES.filter((w) => !w.rg&&!w.rare).map(wearable)
      : tab === 'rg'
        ? [...WEARABLES.filter((w) => w.rg&&!w.rare).map(wearable), ...FURNITURE.filter((f) => f.rg&&!f.rare).map(furniture), background(BACKGROUNDS.find((b) => b.id === 'wall_ribbons')!)]
        : tab === 'studio'
          ? FURNITURE.filter((f) => !f.rg&&!f.rare).map(furniture)
          : BACKGROUNDS.filter(b=>!b.rare).map(background);
  const shown = entries.filter((e) => !hideOwned || !isOwned(save, e.kind, e.id));

  return (
    <div className="shop">
      <div className="row between wrap">
        <h1 className="h-inline">החנות</h1>
        <span className="muted">
          יש לך <CoinAmount value={save.coins} /> · אין כאן כסף אמיתי — רק מטבעות מהמשחק.
        </span>
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['clothes', 'בגדים ואביזרים'],
            ['rg', 'אוסף התעמלות אומנותית'],
            ['studio', 'רהיטים וקישוטים'],
            ['walls', 'קירות ורצפות'],
            ['rare','האוסף הנדיר'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'rg' && <p className="collection-note">קולקציה בהשראת התעמלות אומנותית: סרטים, חישוקים, כדורים, אלות ובגדי גוף מנצנצים.</p>}
      <label className="check">
        <input type="checkbox" checked={hideOwned} onChange={(e) => setHideOwned(e.target.checked)} /> להסתיר פריטים שכבר שלי
      </label>
      <div className="shop-grid">
        {shown.map((e) => {
          const owned = isOwned(save, e.kind, e.id);
          const check = canBuy(save, e.kind, e.id);
          return (
            <button
              key={`${e.kind}-${e.id}`}
              className={`shop-card ${owned ? 'owned' : ''}`}
              // ignore the second tap of a double-tap that closed the previous dialog
              onClick={() => !e.rare && !owned && Date.now() - closedAt.current > 450 && setBuying(e)}
              aria-disabled={owned||e.rare}
            >
              <div className="shop-thumb">{e.preview}</div>
              <span className="item-name">{e.name}</span>
              {owned ? (
                <span className="tag owned-tag">
                  <Icon name="check" size={14} /> {e.rare?'נדיר · שלך':e.price === 0 ? 'חינם · שלך' : 'שלך'}
                </span>
              ) : e.rare?<span className="tag">הפתעה בסיום משימה</span> : (
                <span className={`tag price-tag ${check.ok ? '' : 'short'}`}>
                  <CoinAmount value={e.price} size={16} />
                  {!check.ok && check.reason === 'coins' && <span className="small"> · חסרים {check.missing}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {buying && (
        <BuyDialog
          kind={buying.kind}
          id={buying.id}
          name={buying.name}
          preview={buying.preview}
          onClose={() => {
            closedAt.current = Date.now();
            setBuying(null);
          }}
        />
      )}
    </div>
  );
}
