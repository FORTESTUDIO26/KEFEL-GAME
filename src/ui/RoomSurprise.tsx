// A surprise pops up somewhere in the room now and then (gift / balloon / star). Tap it: confetti and a few coins.
import { useEffect, useRef, useState } from 'react';
import { COLORS, INK } from '../art/style';
import { playStatus } from '../state/playTime';
import { useStore } from '../state/store';
import { claimSurprise, SURPRISE_COINS, SURPRISE_KINDS, surprisesLeft, type SurpriseKind } from '../state/surprise';
import { sfx } from './sound';
import './RoomSurprise.css';

/** seconds of time in the room before a surprise: the first comes soon, the next ones later */
const firstWait = () => 15 + Math.floor(Math.random() * 15);
const nextWait = () => 50 + Math.floor(Math.random() * 60);

function SurpriseArt({ kind }: { kind: SurpriseKind }) {
  if (kind === 'balloon') return (
    <svg viewBox="0 0 80 110" aria-hidden="true">
      <path d="M40 76 Q34 92 42 106" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={40} cy={40} rx={30} ry={36} fill={COLORS.pink} stroke={INK} strokeWidth={4} />
      <path d="M35 76h10l-5 6Z" fill={COLORS.pink} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={29} cy={26} rx={7} ry={11} fill="#fff" opacity={0.7} transform="rotate(-20 29 26)" />
    </svg>
  );
  if (kind === 'star') return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 6l12 28 30 3-23 20 7 30-26-16-26 16 7-30L8 37l30-3Z" fill={COLORS.sun} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={41} cy={50} r={4} fill={INK} /><circle cx={59} cy={50} r={4} fill={INK} />
      <path d="M43 61q7 6 14 0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x={14} y={42} width={72} height={50} rx={8} fill={COLORS.grape} stroke={INK} strokeWidth={5} />
      <rect x={44} y={42} width={12} height={50} fill={COLORS.sun} stroke={INK} strokeWidth={4} />
      <g className="surprise-lid">
        <rect x={8} y={28} width={84} height={18} rx={6} fill={COLORS.grape} stroke={INK} strokeWidth={5} />
        <rect x={44} y={28} width={12} height={18} fill={COLORS.sun} stroke={INK} strokeWidth={4} />
        <path d="M50 28c-14-20-30-8-16 0ZM50 28c14-20 30-8 16 0Z" fill={COLORS.sun} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Stays mounted while the room is open (so touching items never restarts the wait); hidden while an item is chosen. */
export function RoomSurprise({ hidden = false }: { hidden?: boolean }) {
  const { save, update } = useStore();
  const [shown, setShown] = useState<{ kind: SurpriseKind; x: number; y: number } | null>(null);
  const [opened, setOpened] = useState(false);
  const locked = playStatus(save.playTime).locked;
  const left = surprisesLeft(save, Date.now());
  const waiting = !shown && !locked && left > 0;
  // counts seconds while the page is visible; survives re-renders and item touches
  const clock = useRef({ waited: 0, target: firstWait() });

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const c = clock.current;
      c.waited += 1;
      if (c.waited < c.target) return;
      c.waited = 0;
      c.target = nextWait();
      setOpened(false);
      setShown({ kind: SURPRISE_KINDS[Math.floor(Math.random() * SURPRISE_KINDS.length)], x: 22 + Math.random() * 52, y: 28 + Math.random() * 30 });
    }, 1000);
    return () => window.clearInterval(id);
  }, [waiting]);

  if (!shown || locked || hidden) return null;
  const open = () => {
    if (opened) return;
    setOpened(true);
    sfx.coin();
    update((s) => claimSurprise(s, Date.now()));
    window.setTimeout(() => setShown(null), 1500);
  };
  return (
    <button
      type="button"
      className={`room-surprise ${shown.kind} ${opened ? 'opened' : ''}`}
      style={{ left: `${shown.x}%`, top: `${shown.y}%` }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); open(); }}
      aria-label={opened ? `הפתעה! עוד ${SURPRISE_COINS} מטבעות` : 'הפתעה! הקישי לפתוח'}
    >
      <SurpriseArt kind={shown.kind} />
      {opened && (
        <span className="surprise-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ '--a': `${i * 30}deg` } as React.CSSProperties} />)}
          <b className="surprise-coins">+{SURPRISE_COINS}</b>
        </span>
      )}
    </button>
  );
}
