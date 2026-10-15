// Dance & hip-hop collection. Everything is static (no flashing lights).
import type { FurnitureArtFn, WearableArt } from '../extraArt';
import { INK, shade } from '../color';
import { FO, OUT, hand, heart, hw, star4, torso } from './rigHelpers';
import type { Rig } from '../Dog';

const TILE_COLORS = ['#ff9ec4', '#9fd3f2', '#ffe08a', '#b9a3ed', '#9fe0c2', '#ffbf94'];

function sleeves(r: Rig, c: string, len: number, stripe?: string) {
  return <g>
    {[-1, 1].map((s) => {
      const x = r.cx + s * r.legGap - r.legW / 2 - 3;
      return <g key={s}>
        <rect x={x} y={r.legTop - 4} width={r.legW + 6} height={len} rx={6} fill={c} {...OUT} />
        {stripe && <path d={`M${x + (r.legW + 6) / 2},${r.legTop}V${r.legTop + len - 6}`} stroke={stripe} strokeWidth={3} strokeLinecap="round" />}
      </g>;
    })}
  </g>;
}

export const DANCE_WEARABLE_ART: Record<string, WearableArt> = {
  dance_tracksuit: {
    bodyUnder: ({ r, c, uid }) => {
      const y0 = r.neckY - 6;
      const yMid = r.legTop + 20;
      const d = torso(r, y0, yMid);
      return <g>
        <clipPath id={`${uid}-dtr`}><path d={d} /></clipPath>
        <path d={d} fill={c} />
        <g clipPath={`url(#${uid}-dtr)`}>
          {[-1, 1].map((s) => <path key={s} d={`M${r.cx + s * (hw(r, y0) - 4)},${y0} L${r.cx + s * (hw(r, yMid) - 2)},${yMid + 6}`} stroke="#fff" strokeWidth={4} />)}
          <rect x={r.cx - hw(r, yMid) - 8} y={yMid - 8} width={(hw(r, yMid) + 8) * 2} height={14} fill={shade(c, -0.15)} />
        </g>
        <path d={d} fill="none" {...OUT} />
        <path d={`M${r.cx},${y0 + 10} L${r.cx},${yMid + 2}`} stroke={INK} strokeWidth={1.8} />
        <rect x={r.cx - 3} y={y0 + 22} width={6} height={9} rx={2} fill="#fbf8ff" stroke={INK} strokeWidth={1.2} />
        <path d={`M${r.cx - hw(r, y0) - 4},${y0 + 2} Q${r.cx},${y0 + 18} ${r.cx + hw(r, y0) + 4},${y0 + 2}`} fill="none" stroke={shade(c, -0.2)} strokeWidth={7} strokeLinecap="round" />
        <path d={star4(r.cx - 14, y0 + 34, 5)} fill="#fff" />
      </g>;
    },
    bodyOver: ({ r, c }) => sleeves(r, c, 30, '#fff'),
  },
  dance_twirl_skirt: {
    bodyUnder: ({ r, c }) => {
      const y0 = r.neckY - 4;
      const y1 = r.legTop + 4;
      return <g>
        <path d={torso(r, y0, y1, 3)} fill={shade(c, 0.6)} {...OUT} />
        <path d={heart(r.cx, y0 + 28, 7)} fill={c} stroke={INK} strokeWidth={1.2} />
      </g>;
    },
    bodyOver: ({ r, c }) => {
      const y = r.legTop + 6;
      const top = hw(r, y) + 4;
      const hemY = r.bottom - 24;
      const hem = hw(r, hemY) + 26;
      const n = 8;
      const xs = Array.from({ length: n + 1 }, (_, i) => r.cx - hem + (2 * hem * i) / n);
      const topX = (i: number) => r.cx - top + (2 * top * i) / n;
      return <g>
        {xs.slice(0, n).map((x, i) => (
          <path key={i} d={`M${topX(i)},${y} L${topX(i + 1)},${y} L${xs[i + 1]},${hemY} Q${(x + xs[i + 1]) / 2},${hemY + 9} ${x},${hemY}Z`} fill={i % 2 ? shade(c, -0.12) : c} {...OUT} strokeWidth={1.5} />
        ))}
        <rect x={r.cx - top - 2} y={y - 6} width={(top + 2) * 2} height={8} rx={4} fill={shade(c, -0.25)} {...OUT} strokeWidth={1.4} />
      </g>;
    },
  },
  dance_hightops: {
    feet: ({ r, c }) => {
      const legLen = r.bottom - r.legTop;
      const w = r.legW + 8;
      const topY = r.bottom - legLen * 0.55;
      return <g>
        {[-1, 1].map((s) => {
          const x = r.cx + s * r.legGap;
          return <g key={s}>
            <path d={`M${x - w / 2 - 2},${r.bottom + 5} L${x - w / 2},${topY} L${x + w / 2},${topY} L${x + w / 2 + 2},${r.bottom + 5}Z`} fill={c} {...OUT} />
            <rect x={x - w / 2 - 1} y={topY - 4} width={w + 2} height={8} rx={4} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.5} />
            {[0.3, 0.5, 0.7].map((t) => {
              const yy = topY + (r.bottom - 8 - topY) * t;
              return <path key={t} d={`M${x - 4},${yy - 3} L${x + 4},${yy + 3} M${x + 4},${yy - 3} L${x - 4},${yy + 3}`} stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />;
            })}
            <path d={star4(x + s * (w / 2 - 3), r.bottom - 12, 3.2)} fill="#ffe08a" stroke={INK} strokeWidth={0.8} />
            <rect x={x - w / 2 - 3} y={r.bottom} width={w + 6} height={8} rx={4} fill="#fbf8ff" {...OUT} strokeWidth={1.6} />
          </g>;
        })}
      </g>;
    },
  },
  dance_snapback: {
    head: ({ r, c }) => {
      const { cx, headCy: y, headR: R } = r;
      const top = y - R * 0.9;
      return <g>
        {/* brim worn backwards: it peeks out behind the top of the head */}
        <path d={`M${cx + R * 0.1},${top - R * 0.3} Q${cx + R * 0.7},${top - R * 0.75} ${cx + R * 1.05},${top - R * 0.55} Q${cx + R * 0.8},${top - R * 0.2} ${cx + R * 0.35},${top - R * 0.12}Z`} fill={shade(c, -0.2)} {...OUT} />
        <path d={`M${cx - R * 0.8},${top + R * 0.34} Q${cx - R * 0.82},${top - R * 0.44} ${cx},${top - R * 0.46} Q${cx + R * 0.82},${top - R * 0.44} ${cx + R * 0.8},${top + R * 0.34}Z`} fill={c} {...OUT} />
        <path d={`M${cx - R * 0.8},${top + R * 0.34} Q${cx},${top + R * 0.2} ${cx + R * 0.8},${top + R * 0.34}`} fill="none" stroke={shade(c, -0.25)} strokeWidth={5} />
        {/* adjustable strap opening */}
        <path d={`M${cx - R * 0.22},${top + R * 0.3} Q${cx},${top} ${cx + R * 0.22},${top + R * 0.3}`} fill="#fbf8ff" {...OUT} strokeWidth={1.6} />
        <path d={`M${cx - R * 0.2},${top + R * 0.16} H${cx + R * 0.2}`} stroke={INK} strokeWidth={2} strokeDasharray="2 3" />
        <path d={star4(cx - R * 0.45, top - R * 0.08, 5)} fill="#fff" />
        <circle cx={cx} cy={top - R * 0.46} r={4.5} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.2} />
      </g>;
    },
  },
  dance_neck_headphones: {
    neck: ({ r, c }) => {
      const y = r.neckY + 2;
      const w = hw(r, y) + 6;
      const band = `M${r.cx - w},${y} Q${r.cx},${y + 30} ${r.cx + w},${y}`;
      return <g>
        <path d={band} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={band} fill="none" stroke={c} strokeWidth={5.5} strokeLinecap="round" />
        {[-1, 1].map((s) => (
          <g key={s} transform={`rotate(${s * -20} ${r.cx + s * w} ${y})`}>
            <rect x={r.cx + s * w - 10} y={y - 16} width={20} height={30} rx={9} fill={c} {...OUT} />
            <rect x={r.cx + s * w - 5} y={y - 9} width={10} height={16} rx={5} fill={shade(c, 0.5)} />
          </g>
        ))}
      </g>;
    },
  },
  dance_sweatband: {
    head: ({ r, c }) => {
      const { cx, headCy: y, headR: R } = r;
      const d = `M${cx - R * 0.9},${y - R * 0.3} Q${cx},${y - R * 0.66} ${cx + R * 0.9},${y - R * 0.3}`;
      return <g>
        <path d={d} fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round" />
        <path d={d} fill="none" stroke={c} strokeWidth={11} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        <path d={heart(cx + R * 0.5, y - R * 0.44, 4)} fill="#fff" stroke={INK} strokeWidth={0.8} />
      </g>;
    },
  },
  dance_disco_shades: {
    eyes: ({ r, c }) => {
      const { cx, headCy: y, headR: R } = r;
      const ey = y - R * 0.04;
      const dx = R * 0.38;
      const L = cx - dx - R * 0.32, Rt = cx + dx + R * 0.32;
      return <g>
        <path d={`M${L},${ey - R * 0.2} Q${cx},${ey - R * 0.3} ${Rt},${ey - R * 0.2} Q${Rt + 2},${ey + R * 0.18} ${cx + dx},${ey + R * 0.2} Q${cx + 4},${ey + R * 0.2} ${cx},${ey + R * 0.06} Q${cx - 4},${ey + R * 0.2} ${cx - dx},${ey + R * 0.2} Q${L - 2},${ey + R * 0.18} ${L},${ey - R * 0.2}Z`} fill={c} fillOpacity={0.78} {...OUT} />
        <path d={`M${L + 8},${ey - R * 0.08} L${L + 16},${ey - R * 0.16} M${cx + 10},${ey - R * 0.08} L${cx + 18},${ey - R * 0.16}`} stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
        <path d={star4(L - 4, ey - R * 0.24, 4)} fill="#ffe08a" stroke={INK} strokeWidth={0.8} />
        <path d={star4(Rt + 4, ey - R * 0.24, 4)} fill="#ffe08a" stroke={INK} strokeWidth={0.8} />
      </g>;
    },
  },
  dance_mic: {
    prop: ({ r, c }) => {
      const { hx, hy } = hand(r);
      return <g transform={`rotate(-18 ${hx} ${hy})`}>
        <path d={`M${hx - 5},${hy + 14} L${hx - 7},${hy - 26} H${hx + 7} L${hx + 5},${hy + 14}Z`} fill="#4a4f5a" {...OUT} />
        <rect x={hx - 8} y={hy - 30} width={16} height={8} rx={3} fill={c} {...OUT} strokeWidth={1.6} />
        <circle cx={hx} cy={hy - 42} r={13} fill="#d8dee8" {...OUT} />
        <path d={`M${hx - 12},${hy - 42}H${hx + 12}M${hx},${hy - 54}V${hy - 30}M${hx - 9},${hy - 50}H${hx + 9}M${hx - 9},${hy - 34}H${hx + 9}`} stroke="#9aa6b8" strokeWidth={1.4} />
        <path d={star4(hx + 18, hy - 58, 4)} fill="#fff" stroke={INK} strokeWidth={0.8} />
      </g>;
    },
  },
};

const boombox: FurnitureArtFn = ({ a }) => <g>
  <path d="M-30,-48V-58H30V-48" fill="none" {...FO} strokeWidth={5} />
  <rect x={-46} y={-50} width={92} height={46} rx={10} fill={a} {...FO} />
  {[-28, 28].map((x) => <g key={x}>
    <circle cx={x} cy={-25} r={14} fill="#4a4560" {...FO} strokeWidth={2} />
    <circle cx={x} cy={-25} r={6} fill={shade(a, 0.5)} />
  </g>)}
  <rect x={-12} y={-38} width={24} height={16} rx={3} fill="#fffaf0" {...FO} strokeWidth={1.6} />
  <circle cx={-5} cy={-30} r={3} fill="none" stroke={INK} strokeWidth={1.4} />
  <circle cx={5} cy={-30} r={3} fill="none" stroke={INK} strokeWidth={1.4} />
  {[-8, 0, 8].map((x) => <rect key={x} x={x - 2.5} y={-48} width={5} height={5} rx={1} fill={TILE_COLORS[(x + 8) / 8]} stroke={INK} strokeWidth={1} />)}
</g>;

const speaker: FurnitureArtFn = ({ a }) => <g>
  <rect x={-38} y={-148} width={76} height={142} rx={10} fill="#5a5470" {...FO} />
  <circle cx={0} cy={-120} r={13} fill="#3b3550" stroke={shade(a, 0.4)} strokeWidth={3} />
  <circle cx={0} cy={-120} r={4} fill={shade(a, 0.6)} />
  <circle cx={0} cy={-62} r={28} fill="#3b3550" stroke={shade(a, 0.4)} strokeWidth={4} />
  <circle cx={0} cy={-62} r={15} fill="#4a4560" stroke={INK} strokeWidth={1.5} />
  <circle cx={0} cy={-62} r={6} fill={shade(a, 0.6)} />
  <path d={star4(-26, -138, 4)} fill="#ffe08a" />
  <path d="M-30,-20H30" stroke={shade(a, 0.3)} strokeWidth={4} strokeLinecap="round" />
</g>;

const danceFloor: FurnitureArtFn = () => {
  const rows = 3, cols = 6, bottom = -6, topY = -64, wB = 146, wT = 126;
  const xAt = (row: number, col: number) => {
    const half = wB + ((wT - wB) * row) / rows;
    return -half + (2 * half * col) / cols;
  };
  const yAt = (row: number) => bottom + ((topY - bottom) * row) / rows;
  const tiles = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    tiles.push(<path key={`${row}-${col}`}
      d={`M${xAt(row, col)},${yAt(row)} L${xAt(row, col + 1)},${yAt(row)} L${xAt(row + 1, col + 1)},${yAt(row + 1)} L${xAt(row + 1, col)},${yAt(row + 1)}Z`}
      fill={TILE_COLORS[(row * 2 + col) % TILE_COLORS.length]} stroke="#fffaf0" strokeWidth={2.5} />);
  }
  return <g>
    <path d={`M${-wB - 4},${bottom + 2} H${wB + 4} L${wT + 4},${topY - 2} H${-wT - 4}Z`} fill="#4a4560" {...FO} />
    {tiles}
    <path d={star4(0, -35, 7)} fill="#fff" />
  </g>;
};

const discoBall: FurnitureArtFn = () => {
  const cy = -40, R = 32;
  return <g>
    <path d={`M0,-140V${cy - R}`} {...FO} />
    <rect x={-6} y={cy - R - 8} width={12} height={9} rx={2} fill="#c9ced8" {...FO} strokeWidth={1.6} />
    <circle cx={0} cy={cy} r={R} fill="#dfe6f2" {...FO} />
    {[-0.66, -0.33, 0, 0.33, 0.66].map((t) => (
      <ellipse key={`h${t}`} cx={0} cy={cy + t * R} rx={Math.sqrt(1 - t * t) * R} ry={3} fill="none" stroke="#9aa6b8" strokeWidth={1.2} />
    ))}
    {[0.25, 0.55, 0.85].map((t) => (
      <ellipse key={`v${t}`} cx={0} cy={cy} rx={t * R} ry={R} fill="none" stroke="#9aa6b8" strokeWidth={1.2} />
    ))}
    {[[-14, -12, '#ff9ec4'], [10, 8, '#9fd3f2'], [-6, 16, '#ffe08a'], [16, -16, '#b9a3ed']].map(([x, y, f]) => (
      <rect key={`${x}${y}`} x={(x as number) - 4} y={cy + (y as number) - 4} width={8} height={8} fill={f as string} opacity={0.9} />
    ))}
    <path d={star4(-12, cy - 14, 7)} fill="#fff" />
    <path d={star4(30, cy - 30, 5)} fill="#fff6c8" stroke={INK} strokeWidth={1} />
  </g>;
};

const djBooth: FurnitureArtFn = ({ a }) => <g>
  <rect x={-76} y={-92} width={152} height={88} rx={10} fill={shade(a, 0.35)} {...FO} />
  <rect x={-80} y={-100} width={160} height={10} rx={4} fill="#5a5470" {...FO} />
  {/* static equaliser bars */}
  {[-48, -32, -16, 0, 16, 32, 48].map((x, i) => {
    const h = [18, 30, 42, 26, 36, 22, 14][i];
    return <rect key={x} x={x - 5} y={-20 - h} width={10} height={h} rx={3} fill={TILE_COLORS[i % TILE_COLORS.length]} stroke={INK} strokeWidth={1.2} />;
  })}
  <path d="M-62,-14H62" stroke="#fffaf0" strokeWidth={3} strokeLinecap="round" />
  {/* turntables and mixer */}
  {[-46, 46].map((x) => <g key={x}>
    <ellipse cx={x} cy={-104} rx={24} ry={5} fill="#3b3550" {...FO} strokeWidth={1.8} />
    <ellipse cx={x} cy={-105} rx={7} ry={2} fill={shade(a, 0.5)} />
  </g>)}
  <rect x={-14} y={-112} width={28} height={12} rx={3} fill="#c9ced8" {...FO} strokeWidth={1.6} />
  <path d="M-6,-112V-106M6,-112V-106" stroke={INK} strokeWidth={2} />
  {/* little lamp */}
  <path d="M66,-100Q70,-118 58,-122" fill="none" {...FO} strokeWidth={2.5} />
  <path d="M50,-126L62,-124L58,-116Z" fill="#ffe08a" {...FO} strokeWidth={1.4} />
</g>;

const graffiti: FurnitureArtFn = ({ a }) => <g>
  <path d="M-90,-30Q-96,-76 -60,-84Q-44,-108 -10,-98Q20,-112 46,-94Q88,-96 90,-60Q98,-24 64,-14Q30,-2 0,-10Q-34,-2 -62,-12Q-88,-12 -90,-30Z" fill="#fffaf0" {...FO} />
  {[-70, -20, 40].map((x, i) => <path key={x} d={`M${x},-12v${8 + i * 3}`} stroke={['#ff9ec4', '#9fd3f2', '#ffe08a'][i]} strokeWidth={5} strokeLinecap="round" />)}
  <text x={0} y={-44} textAnchor="middle" fontSize={34} fontWeight={900} fontFamily="Rubik, Arial, sans-serif" fill={a} stroke={INK} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">רוקדים!</text>
  <path d="M-66,-78L-58,-90L-50,-80L-42,-92L-36,-78Z" fill="#ffe08a" {...FO} strokeWidth={1.6} />
  <path d={heart(64, -76, 7)} fill="#ff9ec4" {...FO} strokeWidth={1.4} />
  <path d={star4(72, -34, 6)} fill="#9fd3f2" stroke={INK} strokeWidth={1.2} />
  <path d="M-60,-30q20,8 40,0q20,-8 40,0q20,8 40,0" fill="none" stroke={shade(a, 0.3)} strokeWidth={4} strokeLinecap="round" />
</g>;

export const DANCE_FURNITURE_ART: Record<string, FurnitureArtFn> = {
  dance_boombox: boombox,
  dance_speaker: speaker,
  dance_floor: danceFloor,
  dance_disco_ball: discoBall,
  dance_dj_booth: djBooth,
  dance_graffiti: graffiti,
};
