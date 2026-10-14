import type { ReactNode } from 'react';
import type { ShopKind } from '../content/catalog';
import { buy, canBuy } from '../state/economy';
import { useStore } from '../state/store';
import { CoinAmount, Modal } from './common';
import { sfx } from './sound';
import { useToast } from './toast';

export function BuyDialog({ kind, id, name, preview, onClose, onBought }: { kind: ShopKind; id: string; name: string; preview: ReactNode; onClose: () => void; onBought?: () => void }) {
  const { save, update } = useStore();
  const notify = useToast();
  const check = canBuy(save, kind, id);
  const price = check.ok ? check.price : null;

  const confirm = () => {
    if (!check.ok) return;
    // buy() re-checks against the latest state, so a double tap can never charge twice.
    update((s) => buy(s, kind, id).save);
    sfx.coin();
    notify(`${name} — עכשיו שלך!`);
    onBought?.();
    onClose();
  };

  return (
    <Modal title={name} onClose={onClose}>
      <div className="stack">
        <div className="buy-preview">{preview}</div>
        {check.ok && price !== null && (
          <>
            <p>
              לקנות ב־<CoinAmount value={price} />? יישארו לך <CoinAmount value={save.coins - price} />.
            </p>
            <div className="row">
              <button className="primary big grow" onClick={confirm}>
                כן, לקנות
              </button>
              <button className="ghost" onClick={onClose}>
                לא עכשיו
              </button>
            </div>
          </>
        )}
        {!check.ok && check.reason === 'owned' && <p>הפריט הזה כבר שלך.</p>}
        {!check.ok && check.reason === 'coins' && (
          <>
            <p>
              חסרים עוד <CoinAmount value={check.missing} /> בשביל הפריט הזה. כל לקוח שמסיימים מביא מטבעות.
            </p>
            <button className="primary" onClick={onClose}>
              הבנתי
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
