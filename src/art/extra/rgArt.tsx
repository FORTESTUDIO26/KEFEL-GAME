// Rhythmic-gymnastics collection: competition pieces for the dog and the stage.
import type { FurnitureArtFn, WearableArt } from '../extraArt';
import { INK, shade } from '../color';
import { FO, OUT, hand, heart, hw, star4, torso } from './rigHelpers';

const GOLD = '#f2c14e';

export const RG_WEARABLE_ART: Record<string, WearableArt> = {
  rg_star_ribbon: {
    prop: ({ r, c }) => {
      const { hx, hy } = hand(r);
      const tip = { x: hx - 14, y: hy - 46 };
      const d = `M${tip.x},${tip.y} C${hx - 62},${hy - 58} ${hx - 64},${hy - 100} ${hx - 32},${hy - 102} C${hx - 4},${hy - 104} ${hx - 2},${hy - 74} ${hx - 26},${hy - 76} C${hx - 56},${hy - 80} ${hx - 52},${hy - 132} ${hx - 16},${hy - 136} C${hx + 18},${hy - 140} ${hx + 16},${hy - 110} ${hx - 4},${hy - 114} C${hx - 30},${hy - 120} ${hx - 18},${hy - 168} ${hx + 22},${hy - 176}`;
      return <g>
        <path d={`M${hx + 10},${hy + 10} L${tip.x},${tip.y}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d={`M${hx + 10},${hy + 10} L${tip.x},${tip.y}`} stroke="#fbf8ff" strokeWidth={2.4} strokeLinecap="round" />
        <path d={d} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={d} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#fff" strokeWidth={1.6} strokeDasharray="2 12" strokeLinecap="round" />
        <path d={star4(tip.x, tip.y, 7)} fill={GOLD} stroke={INK} strokeWidth={1.4} />
        <path d={star4(hx + 26, hy - 180, 5)} fill="#fff" stroke={INK} strokeWidth={1} />
      </g>;
    },
  },
  rg_glitter_hoop: {
    prop: ({ r, c }) => {
      const { hx, hy } = hand(r);
      const cx = hx - 4, cy = hy - 30, R = 40;
      return <g>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={INK} strokeWidth={11} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={c} strokeWidth={7} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={shade(c, 0.6)} strokeWidth={7} strokeDasharray="8 8" transform={`rotate(20 ${cx} ${cy})`} />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const t = (deg * Math.PI) / 180;
          return <path key={deg} d={star4(cx + Math.cos(t) * R, cy + Math.sin(t) * R, deg % 120 ? 4 : 6)} fill={deg % 120 ? '#fff' : GOLD} stroke={INK} strokeWidth={1} />;
        })}
      </g>;
    },
  },
  rg_star_ball: {
    prop: ({ r, c }) => {
      const { hx, hy } = hand(r);
      const x = hx - 4, y = hy + 4;
      return <g>
        <circle cx={x} cy={y} r={26} fill={c} {...OUT} />
        <path d={`M${x - 26},${y + 2} Q${x},${y + 14} ${x + 26},${y + 2}`} fill="none" stroke={shade(c, -0.18)} strokeWidth={3} />
        <path d={star4(x + 2, y - 4, 11)} fill="#fff" stroke={INK} strokeWidth={1.2} />
        {[[-14, 10], [14, 12], [-12, -14], [16, -12]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={x + dx} cy={y + dy} r={2.4} fill={GOLD} />)}
        <path d={`M${x - 18},${y - 12} Q${x - 12},${y - 22} ${x - 2},${y - 23}`} fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" opacity={0.8} />
      </g>;
    },
  },
  rg_heart_clubs: {
    prop: ({ r, c }) => {
      const { hx, hy } = hand(r);
      return <g>
        {[-10, 12].map((dx, i) => {
          const x = hx + dx;
          return <g key={dx} transform={`rotate(${i ? 16 : -16} ${x} ${hy})`}>
            <path d={`M${x - 4},${hy + 20} L${x - 3},${hy - 18} Q${x - 14},${hy - 40} ${x},${hy - 62} Q${x + 14},${hy - 40} ${x + 3},${hy - 18} L${x + 4},${hy + 20}Z`} fill={i ? shade(c, 0.35) : c} {...OUT} />
            <path d={`M${x - 8},${hy - 30} L${x + 8},${hy - 26}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
            <path d={heart(x, hy - 46, 5)} fill="#fff" stroke={INK} strokeWidth={1} />
            <circle cx={x} cy={hy + 22} r={5.5} fill={GOLD} {...OUT} strokeWidth={1.4} />
          </g>;
        })}
      </g>;
    },
  },
  rg_competition_leotard: {
    bodyUnder: ({ r, c, uid }) => {
      const y0 = r.neckY - 6;
      const yMid = r.legTop + 18;
      const d = torso(r, y0, yMid - 4, 3);
      const left = r.cx - hw(r, y0) - 8;
      const right = r.cx + hw(r, yMid) + 8;
      return <g>
        <clipPath id={`${uid}-rgcl`}><path d={d} /></clipPath>
        <path d={d} fill={c} />
        <g clipPath={`url(#${uid}-rgcl)`}>
          <path d={`M${left},${y0 + 6} L${left + 18},${y0 - 4} L${right},${yMid - 22} L${right - 10},${yMid - 4}Z`} fill={shade(c, 0.45)} />
          {[0.15, 0.35, 0.55, 0.75, 0.92].map((t) => (
            <path key={t} d={star4(left + 10 + (right - left - 14) * t, y0 + 2 + (yMid - 16 - y0) * t, 4.5)} fill="#fff" />
          ))}
        </g>
        <path d={d} fill="none" {...OUT} />
        <circle cx={r.cx - 12} cy={yMid - 14} r={2.6} fill={GOLD} />
        <circle cx={r.cx + 14} cy={y0 + 24} r={2.6} fill={GOLD} />
      </g>;
    },
    bodyOver: ({ r, c }) => {
      const y = r.legTop + 10;
      const w = hw(r, y) + 12;
      const n = 6;
      const scallops = Array.from({ length: n }, (_, i) => {
        const x0 = r.cx + w - (2 * w * i) / n;
        const x1 = r.cx + w - (2 * w * (i + 1)) / n;
        return `Q${(x0 + x1) / 2},${y + 30} ${x1},${y + 18}`;
      }).join(' ');
      return <g>
        <path d={`M${r.cx - w + 6},${y - 4} L${r.cx + w - 6},${y - 4} L${r.cx + w},${y + 18} ${scallops} Z`} fill={shade(c, 0.55)} opacity={0.88} {...OUT} strokeWidth={1.4} />
        <rect x={r.cx - w + 4} y={y - 8} width={(w - 4) * 2} height={7} rx={3.5} fill={shade(c, -0.15)} {...OUT} strokeWidth={1.3} />
      </g>;
    },
  },
  rg_gold_medal: {
    neck: ({ r, c }) => {
      const y = r.neckY;
      const w = hw(r, y) + 4;
      const my = y + 34;
      const ribbon = `M${r.cx - w},${y - 2} L${r.cx - 5},${my - 8} M${r.cx + w},${y - 2} L${r.cx + 5},${my - 8}`;
      return <g>
        <path d={ribbon} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={ribbon} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />
        <path d={ribbon} fill="none" stroke="#fff" strokeWidth={1.4} strokeDasharray="3 5" />
        <circle cx={r.cx} cy={my + 4} r={12} fill={GOLD} {...OUT} />
        <circle cx={r.cx} cy={my + 4} r={8} fill="none" stroke={shade(GOLD, -0.2)} strokeWidth={1.5} />
        <path d={star4(r.cx, my + 4, 5.5)} fill="#fff" />
      </g>;
    },
  },
  rg_tiara: {
    head: ({ r, c }) => {
      const { cx, headCy: y, headR: R } = r;
      const top = y - R * 0.9;
      const band = `M${cx - R * 0.62},${top + R * 0.32} Q${cx},${top - R * 0.08} ${cx + R * 0.62},${top + R * 0.32}`;
      const peaks = [-0.44, -0.22, 0, 0.22, 0.44];
      return <g>
        {peaks.map((t, i) => {
          const x = cx + t * R;
          const base = top + R * 0.12 + Math.abs(t) * R * 0.32;
          const h = i === 2 ? 22 : i % 2 ? 14 : 10;
          return <path key={t} d={`M${x - 6},${base} L${x},${base - h} L${x + 6},${base}Z`} fill={shade(GOLD, 0.2)} {...OUT} strokeWidth={1.4} />;
        })}
        <path d={band} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d={band} fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
        {peaks.map((t, i) => {
          const x = cx + t * R;
          const base = top + R * 0.12 + Math.abs(t) * R * 0.32;
          return <circle key={t} cx={x} cy={base - (i === 2 ? 12 : 4)} r={i === 2 ? 4.5 : 3} fill={i === 2 ? c : shade(c, 0.4)} stroke={INK} strokeWidth={1.1} />;
        })}
        <path d={star4(cx + R * 0.5, top - 14, 4)} fill="#fff" />
      </g>;
    },
  },
  rg_half_shoes: {
    feet: ({ r, c }) => {
      const legLen = r.bottom - r.legTop;
      const w = r.legW + 6;
      return <g>
        {[-1, 1].map((s) => {
          const x = r.cx + s * r.legGap;
          const strapY = r.bottom - legLen * 0.32;
          return <g key={s}>
            <path d={`M${x - w / 2},${strapY} L${x + w / 2},${strapY}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d={`M${x - w / 2},${strapY} L${x + w / 2},${strapY}`} stroke={shade(c, 0.5)} strokeWidth={3.5} strokeLinecap="round" />
            <path d={`M${x - w / 2 - 1},${r.bottom + 6} Q${x - w / 2 - 1},${r.bottom - 14} ${x},${r.bottom - 15} Q${x + w / 2 + 1},${r.bottom - 14} ${x + w / 2 + 1},${r.bottom + 6}Z`} fill={c} {...OUT} />
            <ellipse cx={x} cy={r.bottom - 3} rx={w * 0.28} ry={4} fill={shade(c, 0.45)} />
          </g>;
        })}
      </g>;
    },
  },
};

const podium: FurnitureArtFn = ({ a }) => {
  const steps = [
    { x: -108, w: 72, h: 70, fill: '#e5e8f2', n: '2' },
    { x: -36, w: 72, h: 100, fill: '#ffe08a', n: '1' },
    { x: 36, w: 72, h: 50, fill: '#f6c6a0', n: '3' },
  ];
  return <g>
    {steps.map((s) => <g key={s.n}>
      <rect x={s.x} y={-s.h - 4} width={s.w} height={s.h} rx={6} fill={s.fill} {...FO} />
      <rect x={s.x} y={-s.h - 4} width={s.w} height={10} rx={5} fill={shade(a, 0.45)} {...FO} strokeWidth={1.8} />
      <circle cx={s.x + s.w / 2} cy={-s.h / 2 - 2} r={14} fill="#fffaf0" {...FO} strokeWidth={1.8} />
      <text x={s.x + s.w / 2} y={-s.h / 2 + 5} textAnchor="middle" fontSize={20} fontWeight={800} fill={INK} fontFamily="Rubik, Arial, sans-serif">{s.n}</text>
    </g>)}
    <path d={star4(-86, -88, 5)} fill="#fff" stroke={INK} strokeWidth={1} />
    <path d={star4(88, -66, 5)} fill="#fff" stroke={INK} strokeWidth={1} />
  </g>;
};

const trophy: FurnitureArtFn = ({ a }) => <g>
  <rect x={-18} y={-14} width={36} height={11} rx={3} fill="#c9a16d" {...FO} strokeWidth={2} />
  <rect x={-12} y={-20} width={24} height={7} rx={2} fill={shade(a, 0.2)} {...FO} strokeWidth={1.6} />
  <path d="M-4,-20V-32H4V-20" fill={a} {...FO} strokeWidth={1.8} />
  <path d="M-16,-30q-12,-4 -12,-18q0,-10 8,-10M16,-30q12,-4 12,-18q0,-10 -8,-10" fill="none" {...FO} strokeWidth={3} />
  <path d="M-20,-70H20Q20,-34 0,-32Q-20,-34 -20,-70Z" fill={a} {...FO} />
  <path d={star4(0, -52, 8)} fill="#fff" />
  <path d="M-14,-64q2,14 8,22" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
</g>;

const spotlight: FurnitureArtFn = ({ a }) => <g>
  <path d="M0,-98L-30,-4M0,-98L30,-4M0,-98V-4" fill="none" {...FO} strokeWidth={4} />
  <path d="M-24,-30H24" stroke={INK} strokeWidth={2} />
  <g transform="rotate(-12 0 -128)">
    <path d="M-10,-104L0,-98L10,-104" fill="none" {...FO} strokeWidth={4} />
    <rect x={-24} y={-150} width={48} height={46} rx={10} fill={shade(a, 0.35)} {...FO} />
    <path d="M-30,-152H30L24,-144H-24Z" fill={shade(a, 0.1)} {...FO} strokeWidth={1.8} />
    <circle cx={0} cy={-127} r={15} fill="#fff6c8" {...FO} strokeWidth={2} />
    <circle cx={-4} cy={-131} r={5} fill="#fff" />
  </g>
  <path d={star4(26, -158, 5)} fill="#ffe08a" stroke={INK} strokeWidth={1} />
</g>;

const carpet: FurnitureArtFn = ({ a }) => <g>
  <path d="M-148,-6H148L134,-60H-134Z" fill={shade(a, 0.55)} {...FO} />
  <path d="M-132,-13H132L121,-53H-121Z" fill={shade(a, 0.4)} stroke="#fffaf0" strokeWidth={3} />
  <path d="M-80,-33C-50,-56 -30,-10 0,-33C30,-56 50,-10 80,-33" fill="none" stroke="#ff9ec4" strokeWidth={4} strokeLinecap="round" />
  <path d={star4(0, -33, 9)} fill="#fff" />
  <path d={star4(-104, -33, 5)} fill="#fff" />
  <path d={star4(104, -33, 5)} fill="#fff" />
</g>;

const curtain: FurnitureArtFn = ({ a }) => {
  const drape = shade(a, 0.3);
  return <g>
    <path d="M-98,-146H-56Q-62,-90 -46,-58Q-70,-40 -72,-6H-98Z" fill={drape} {...FO} />
    <path d="M98,-146H56Q62,-90 46,-58Q70,-40 72,-6H98Z" fill={drape} {...FO} />
    <path d="M-88,-130Q-80,-90 -90,-20M88,-130Q80,-90 90,-20" fill="none" stroke={shade(drape, -0.15)} strokeWidth={2.5} />
    <circle cx={-50} cy={-58} r={6} fill={GOLD} {...FO} strokeWidth={1.6} />
    <circle cx={50} cy={-58} r={6} fill={GOLD} {...FO} strokeWidth={1.6} />
    <path d="M-100,-148H100V-126Q90,-112 75,-126Q60,-112 45,-126Q30,-112 15,-126Q0,-112 -15,-126Q-30,-112 -45,-126Q-60,-112 -75,-126Q-90,-112 -100,-126Z" fill={shade(a, 0.1)} {...FO} />
    {[-75, -45, -15, 15, 45, 75].map((x) => <circle key={x} cx={x} cy={-122} r={3} fill={GOLD} />)}
    {[-30, 0, 30].map((x, i) => <path key={x} d={star4(x, -96 + (i % 2) * 14, i === 1 ? 7 : 5)} fill="#fff6c8" stroke={INK} strokeWidth={1} />)}
  </g>;
};

const medalBoard: FurnitureArtFn = ({ a }) => <g>
  <rect x={-54} y={-98} width={108} height={60} rx={10} fill="#f0d3a8" {...FO} />
  <rect x={-46} y={-90} width={92} height={18} rx={9} fill={shade(a, 0.5)} {...FO} strokeWidth={1.8} />
  <path d={star4(0, -81, 6)} fill="#fff" />
  {[{ x: -32, fill: '#e5e8f2' }, { x: 0, fill: GOLD }, { x: 32, fill: '#f0b07f' }].map(({ x, fill }, i) => <g key={x}>
    <circle cx={x} cy={-58} r={3} fill={INK} />
    <path d={`M${x - 6},${-58} L${x - 2},${-24 + i * 2} M${x + 6},${-58} L${x + 2},${-24 + i * 2}`} stroke={i === 1 ? '#ef4f5f' : shade(a, 0.2)} strokeWidth={4} strokeLinecap="round" />
    <circle cx={x} cy={-16 + i * 2} r={10} fill={fill} {...FO} strokeWidth={2} />
    <path d={star4(x, -16 + i * 2, 4)} fill="#fff" />
  </g>)}
</g>;

export const RG_FURNITURE_ART: Record<string, FurnitureArtFn> = {
  rg_podium: podium,
  rg_trophy: trophy,
  rg_spotlight: spotlight,
  rg_carpet: carpet,
  rg_stage_curtain: curtain,
  rg_medal_board: medalBoard,
};
