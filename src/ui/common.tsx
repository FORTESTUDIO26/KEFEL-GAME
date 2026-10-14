import { useEffect, useRef, type ReactNode } from 'react';
import { splitMath, type ArrayVisual } from '../learning/hints';
import { Coin, Icon } from './icons';

/** A math expression, always shown left-to-right inside Hebrew text. */
export function Eq({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={`eq ${className ?? ''}`}>
      {children}
    </bdi>
  );
}

/** Hebrew text with [[math]] segments. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitMath(text).map((p, i) => (p.math ? <Eq key={i}>{p.value}</Eq> : <span key={i}>{p.value}</span>))}
    </>
  );
}

export function CoinAmount({ value, size }: { value: number; size?: number }) {
  return (
    <span className="coin-amount">
      <Coin size={size} />
      <bdi dir="ltr">{value}</bdi>
    </span>
  );
}

/** Rows × cols paw-dot picture, with an optional coloured split. */
export function ArrayPicture({ v }: { v: ArrayVisual }) {
  const cell = 22;
  const w = v.cols * cell;
  const h = v.rows * cell;
  const dots = [];
  for (let r = 0; r < v.rows; r++)
    for (let c = 0; c < v.cols; c++) {
      const first = v.split === undefined ? true : v.dir === 'cols' ? c < v.split : r < v.split;
      dots.push(<circle key={`${r}-${c}`} cx={c * cell + cell / 2} cy={r * cell + cell / 2} r={7.5} fill={first ? 'var(--lilac)' : 'var(--turq)'} />);
    }
  const sepX = v.split !== undefined && v.dir === 'cols' ? v.split * cell : null;
  const sepY = v.split !== undefined && v.dir !== 'cols' ? v.split * cell : null;
  return (
    <div className="array-pic" dir="ltr">
      <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} style={{ maxWidth: Math.min(320, w * 1.2) }} role="img" aria-label={`${v.rows} שורות של ${v.cols}`}>
        {dots}
        {sepX !== null && <line x1={sepX} y1={-2} x2={sepX} y2={h + 2} stroke="var(--ink)" strokeWidth={2} strokeDasharray="4 3" />}
        {sepY !== null && <line x1={-2} y1={sepY} x2={w + 2} y2={sepY} stroke="var(--ink)" strokeWidth={2} strokeDasharray="4 3" />}
      </svg>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose?: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusable =
      el?.querySelector<HTMLElement>('input, button.primary') ?? el?.querySelector<HTMLElement>('button, [tabindex]');
    focusable?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal card ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="סגירה">
              <Icon name="close" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Keypad({ onDigit, onBack, onEnter, disabled }: { onDigit: (d: string) => void; onBack: () => void; onEnter: () => void; disabled?: boolean }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div className="keypad" dir="ltr" aria-label="מקלדת מספרים">
      {keys.map((k) => (
        <button key={k} type="button" disabled={disabled} onClick={() => onDigit(k)}>
          {k}
        </button>
      ))}
      <button type="button" className="kp-back" disabled={disabled} onClick={onBack} aria-label="מחיקה">
        ⌫
      </button>
      <button type="button" disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" className="kp-enter" disabled={disabled} onClick={onEnter} aria-label="בדיקה">
        <Icon name="check" size={28} />
      </button>
    </div>
  );
}

export function Stars({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${n} מתוך ${max} כוכבים`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'on' : 'off'}>
          <Icon name="star" size={20} />
        </span>
      ))}
    </span>
  );
}
