// Studio furniture in the bold, toy-like look (2026-10): dark plum outlines, flat saturated fills,
// little white shines. Original drawings. Each piece is drawn around (0,0) = bottom-centre, growing
// upwards, inside its catalog w×h box. Interactive pieces read `state` (see content/interactive.ts).
import type { ReactNode } from 'react';
import type { FurnitureArtFn } from '../extraArt';
import { COLORS, INK, LINE } from '../style';
import { shade } from '../color';
import { heart, star4 } from './rigHelpers';

const O = { stroke: INK, strokeWidth: LINE.base, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const T = { ...O, strokeWidth: LINE.thin };
const C = COLORS;
const WATER = '#6fcaff';
const GLOW = '#fff2a0';

// ---------- shared bits ----------
const Shadow = ({ rx, cy = -2 }: { rx: number; cy?: number }) => <ellipse cx={0} cy={cy} rx={rx} ry={Math.max(4, rx * 0.08)} fill={INK} opacity={0.16} />;
const Shine = ({ d, w = 4 }: { d: string; w?: number }) => <path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap="round" opacity={0.6} />;
/** thick outlined stroke: an INK line with a coloured line on top */
const Tube = ({ d, c, w = 6 }: { d: string; c: string; w?: number }) => <g fill="none" strokeLinecap="round" strokeLinejoin="round">
  <path d={d} stroke={INK} strokeWidth={w + LINE.base * 1.6} />
  <path d={d} stroke={c} strokeWidth={w} />
</g>;

export function Flower({ x, y, r = 6, c = C.pink, center = C.sun }: { x: number; y: number; r?: number; c?: string; center?: string }) {
  return <g>
    {[0, 72, 144, 216, 288].map((ang) => <circle key={ang} cx={x + Math.cos((ang * Math.PI) / 180 - Math.PI / 2) * r} cy={y + Math.sin((ang * Math.PI) / 180 - Math.PI / 2) * r} r={r * 0.72} fill={c} {...T} strokeWidth={1.5} />)}
    <circle cx={x} cy={y} r={r * 0.55} fill={center} {...T} strokeWidth={1.4} />
  </g>;
}

export type PlantState = 'dry' | 'watered' | 'bloom';
export function plantState(s: string | undefined, fallback: PlantState = 'watered'): PlantState {
  return s === 'dry' || s === 'watered' || s === 'bloom' ? s : fallback;
}
const leaf = (st: PlantState, i = 0) => (st === 'dry' ? (i % 2 ? '#d1b85a' : '#bfa04a') : i % 2 ? C.lime : C.green);
const vein = (st: PlantState) => (st === 'dry' ? '#8a6f2c' : '#13703c');
const Soil = ({ rx, y, st }: { rx: number; y: number; st: PlantState }) => <g>
  <ellipse cx={0} cy={y} rx={rx} ry={Math.max(3, rx * 0.2)} fill={st === 'dry' ? '#c69a66' : '#5b3a26'} {...T} />
  {st === 'dry' && <path d={`M${-rx * 0.5},${y} l${rx * 0.2},-2 l${rx * 0.15},3 M${rx * 0.2},${y + 1} l${rx * 0.25},-2`} stroke="#8a6440" strokeWidth={1.4} fill="none" />}
  {st !== 'dry' && <ellipse cx={-rx * 0.35} cy={y - 1} rx={rx * 0.22} ry={1.4} fill="#fff" opacity={0.45} />}
</g>;
/** a few water drops shining on freshly watered leaves */
const Dew = ({ pts }: { pts: [number, number][] }) => <g>{pts.map(([x, y], i) => <path key={i} d={`M${x},${y - 5} Q${x + 4},${y} ${x},${y + 2} Q${x - 4},${y} ${x},${y - 5}Z`} fill={WATER} {...T} strokeWidth={1.2} />)}</g>;
const FallenLeaf = ({ x, y }: { x: number; y: number }) => <path d={`M${x - 7},${y} Q${x},${y - 7} ${x + 7},${y} Q${x},${y + 3} ${x - 7},${y}Z`} fill="#c7a34c" {...T} strokeWidth={1.4} />;

// ---------- effects (CSS classes live in art/interactive.css) ----------
/** warm light glow; pulses gently */
const Glow = ({ d, children }: { d?: string; children?: ReactNode }) => <g className="kg-fx-glow" pointerEvents="none">
  {d && <path d={d} fill={GLOW} opacity={0.45} />}
  {children}
</g>;
/** a running tap: stream from (x,y1) to the basin at y2, with falling droplets and a splash */
export function WaterStream({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  const len = y2 - y1;
  return <g data-fx="water" pointerEvents="none">
    <path d={`M${x - 3},${y1} L${x + 3},${y1} L${x + 4.5},${y2} L${x - 4.5},${y2}Z`} fill={WATER} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
    <g className="kg-fx-flow">
      {[0, 1, 2].map((i) => <path key={i} d={`M${x},${y1 + 3 + (i * len) / 3} v${Math.min(6, len / 4)}`} stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />)}
    </g>
    <g className="kg-fx-splash">
      <circle cx={x - 9} cy={y2 - 4} r={2.4} fill={WATER} stroke={INK} strokeWidth={1} />
      <circle cx={x + 9} cy={y2 - 6} r={2} fill={WATER} stroke={INK} strokeWidth={1} />
      <circle cx={x + 3} cy={y2 - 9} r={1.6} fill={WATER} stroke={INK} strokeWidth={1} />
    </g>
    <ellipse cx={x} cy={y2} rx={9} ry={2.5} fill="none" stroke="#fff" strokeWidth={1.6} className="kg-fx-ripple" />
  </g>;
}
/** drops falling from a spout at (x,y) */
const Drops = ({ x, y, n = 4, dx = 2 }: { x: number; y: number; n?: number; dx?: number }) => <g className="kg-fx-drops" pointerEvents="none">
  {Array.from({ length: n }, (_, i) => <path key={i} className={`kg-fx-drop kg-fx-d${i % 4}`} d={`M${x + i * dx},${y + i * 8} q4,6 0,9 q-4,-3 0,-9Z`} fill={WATER} stroke={INK} strokeWidth={1} />)}
</g>;
const Notes = ({ x, y }: { x: number; y: number }) => <g pointerEvents="none">
  {[[0, 0, C.pink], [16, -10, C.sky], [-14, -16, C.sun]].map(([dx, dy, c], i) => <g key={i} className={`kg-fx-note kg-fx-n${i}`}>
    <path d={`M${x + (dx as number) + 5},${y + (dy as number)} v-14 l8,-3 v14`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    <ellipse cx={x + (dx as number) + 2.5} cy={y + (dy as number)} rx={4} ry={3} fill={c as string} {...T} strokeWidth={1.5} />
    <ellipse cx={x + (dx as number) + 10.5} cy={y + (dy as number) - 3} rx={4} ry={3} fill={c as string} {...T} strokeWidth={1.5} />
  </g>)}
</g>;

// ---------- seating ----------
const sofa: FurnitureArtFn = ({ a, b }) => <g>
  <Shadow rx={104} />
  <rect x={-90} y={-18} width={12} height={18} rx={3} fill={C.woodDark} {...T} />
  <rect x={78} y={-18} width={12} height={18} rx={3} fill={C.woodDark} {...T} />
  <rect x={-94} y={-118} width={188} height={66} rx={24} fill={a} {...O} />
  <path d="M0,-112V-60" stroke={shade(a, -0.3)} strokeWidth={3} />
  <circle cx={-47} cy={-90} r={3.5} fill={shade(a, -0.35)} /><circle cx={47} cy={-90} r={3.5} fill={shade(a, -0.35)} />
  <Shine d="M-80,-108H-40" />
  <rect x={-98} y={-66} width={196} height={50} rx={16} fill={shade(a, -0.15)} {...O} />
  <rect x={-80} y={-70} width={78} height={22} rx={10} fill={shade(a, 0.12)} {...O} />
  <rect x={2} y={-70} width={78} height={22} rx={10} fill={shade(a, 0.12)} {...O} />
  <rect x={-110} y={-92} width={36} height={76} rx={18} fill={a} {...O} />
  <rect x={74} y={-92} width={36} height={76} rx={18} fill={a} {...O} />
  <Shine d="M-100,-80Q-92,-87 -84,-80" w={3} /><Shine d="M84,-80Q92,-87 100,-80" w={3} />
  <g transform="rotate(-10 -52 -86)">
    <rect x={-74} y={-106} width={44} height={40} rx={12} fill={C.sun} {...O} />
    {[[-62, -94], [-46, -90], [-58, -78], [-42, -76]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={2.6} fill="#fff" />)}
  </g>
  <g transform="rotate(8 52 -84)">
    <rect x={30} y={-102} width={44} height={38} rx={12} fill={b} {...O} />
    <path d={heart(52, -85, 9)} fill="#fff" />
  </g>
</g>;

const armchair: FurnitureArtFn = ({ b }) => <g>
  <Shadow rx={58} />
  <rect x={-48} y={-18} width={11} height={18} rx={3} fill={C.woodDark} {...T} />
  <rect x={37} y={-18} width={11} height={18} rx={3} fill={C.woodDark} {...T} />
  <rect x={-46} y={-122} width={92} height={72} rx={30} fill={b} {...O} />
  <circle cx={0} cy={-96} r={3.5} fill={shade(b, -0.35)} />
  <Shine d="M-30,-110Q-18,-116 -6,-114" />
  <rect x={-50} y={-70} width={100} height={54} rx={14} fill={shade(b, -0.15)} {...O} />
  <rect x={-36} y={-74} width={72} height={20} rx={9} fill={shade(b, 0.15)} {...O} />
  <rect x={-60} y={-92} width={26} height={76} rx={13} fill={b} {...O} />
  <rect x={34} y={-92} width={26} height={76} rx={13} fill={b} {...O} />
  <Shine d="M-53,-82v10" w={3} /><Shine d="M41,-82v10" w={3} />
</g>;

const loveseat: FurnitureArtFn = ({ a }) => <g>
  <Shadow rx={84} />
  <rect x={-72} y={-18} width={12} height={18} rx={3} fill={C.woodDark} {...T} />
  <rect x={60} y={-18} width={12} height={18} rx={3} fill={C.woodDark} {...T} />
  <rect x={-74} y={-108} width={148} height={60} rx={24} fill={a} {...O} />
  <path d="M0,-102V-58" stroke={shade(a, -0.3)} strokeWidth={3} />
  <Shine d="M-60,-98H-28" />
  <rect x={-80} y={-66} width={160} height={50} rx={15} fill={shade(a, -0.15)} {...O} />
  <rect x={-62} y={-70} width={60} height={20} rx={9} fill={shade(a, 0.12)} {...O} />
  <rect x={2} y={-70} width={60} height={20} rx={9} fill={shade(a, 0.12)} {...O} />
  <rect x={-88} y={-86} width={30} height={70} rx={15} fill={a} {...O} />
  <rect x={58} y={-86} width={30} height={70} rx={15} fill={a} {...O} />
  <path d={heart(-28, -84, 14)} fill={C.pink} {...O} transform="rotate(-8 -28 -84)" />
</g>;

const cozyChair: FurnitureArtFn = ({ a }) => <g>
  <Shadow rx={52} />
  <path d="M-34,-12 l-6,12 M34,-12 l6,12" stroke={INK} strokeWidth={6} strokeLinecap="round" />
  <path d="M-52,-18 Q-60,-108 0,-108 Q60,-108 52,-18 Q40,-8 0,-8 Q-40,-8 -52,-18Z" fill={a} {...O} />
  <path d="M-38,-30 Q-44,-92 0,-92 Q44,-92 38,-30Z" fill={shade(a, 0.35)} {...T} />
  <path d="M-24,-80 Q0,-90 24,-80" fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="5 6" strokeLinecap="round" />
  <ellipse cx={0} cy={-24} rx={46} ry={12} fill={shade(a, -0.1)} {...O} />
  <Shine d="M-46,-60Q-46,-88 -26,-98" />
</g>;

const pouf: FurnitureArtFn = ({ a }) => <g>
  <Shadow rx={36} />
  <path d="M-34,-12 Q-38,-44 0,-46 Q38,-44 34,-12 Q32,-3 0,-3 Q-32,-3 -34,-12Z" fill={a} {...O} />
  {[-22, -8, 8, 22].map((x) => <path key={x} d={`M${x},-42 Q${x * 1.25},-24 ${x},-6`} fill="none" stroke={shade(a, -0.25)} strokeWidth={2.5} />)}
  <ellipse cx={0} cy={-40} rx={28} ry={6} fill={shade(a, 0.3)} {...T} />
  <circle cx={0} cy={-40} r={3} fill={shade(a, -0.3)} />
</g>;

const cushions: FurnitureArtFn = ({ a, b }) => <g>
  <Shadow rx={54} />
  <rect x={-54} y={-34} width={62} height={30} rx={13} fill={a} {...O} />
  <rect x={-4} y={-38} width={58} height={34} rx={13} fill={C.sun} {...O} />
  <path d="M6,-30H44M6,-21H44M6,-12H44" stroke={C.orange} strokeWidth={3} strokeLinecap="round" />
  <g transform="rotate(-8 -2 -50)">
    <rect x={-30} y={-68} width={56} height={34} rx={14} fill={b} {...O} />
    <path d={heart(-2, -52, 9)} fill="#fff" />
  </g>
</g>;

const dogBed: FurnitureArtFn = ({ a }) => <g>
  <Shadow rx={64} />
  <ellipse cx={0} cy={-22} rx={62} ry={22} fill={a} {...O} />
  <ellipse cx={0} cy={-26} rx={46} ry={12} fill={C.cream} {...T} />
  {[[-20, -27], [8, -29], [24, -24]].map(([x, y]) => <g key={x} fill={shade(a, 0.4)}>
    <ellipse cx={x} cy={y} rx={4} ry={2.6} /><circle cx={x - 4} cy={y - 3.5} r={1.3} /><circle cx={x} cy={y - 4.5} r={1.3} /><circle cx={x + 4} cy={y - 3.5} r={1.3} />
  </g>)}
  <path d="M-62,-22 Q-58,-2 0,-2 Q58,-2 62,-22 Q40,-10 0,-10 Q-40,-10 -62,-22Z" fill={shade(a, -0.15)} {...O} />
  <path d="M-10,-7h20 M-12,-9.5a2.5,2.5 0 1,0 0,5 M12,-9.5a2.5,2.5 0 1,1 0,5" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" />
</g>;

const roundDogBed: FurnitureArtFn = ({ a }) => <g>
  <Shadow rx={60} />
  <ellipse cx={0} cy={-24} rx={58} ry={24} fill={a} {...O} />
  <ellipse cx={0} cy={-28} rx={40} ry={12} fill={C.cream} {...T} />
  <path d="M-30,-30 Q0,-36 30,-30" fill="none" stroke={shade(a, 0.5)} strokeWidth={2} strokeDasharray="4 5" />
  <path d="M-58,-24 Q-54,-3 0,-3 Q54,-3 58,-24 Q40,-12 0,-12 Q-40,-12 -58,-24Z" fill={shade(a, -0.15)} {...O} />
  <path d="M-44,-10 Q0,-1 44,-10" fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" />
</g>;

// ---------- textiles ----------
const rugRound: FurnitureArtFn = ({ a, b }) => <g>
  <ellipse cx={0} cy={-34} rx={128} ry={32} fill={a} {...O} />
  <ellipse cx={0} cy={-34} rx={106} ry={25} fill={C.cream} {...T} />
  <ellipse cx={0} cy={-34} rx={84} ry={19} fill={shade(a, 0.35)} {...T} />
  <ellipse cx={0} cy={-34} rx={50} ry={10} fill={C.sun} {...T} />
  {Array.from({ length: 12 }, (_, i) => {
    const t = (i / 12) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(t) * 95} cy={-34 + Math.sin(t) * 22} r={3.2} fill={b} />;
  })}
</g>;

const rugStripes: FurnitureArtFn = ({ a, b }) => {
  const cols = [a, C.sun, b, C.pink];
  return <g>
    <rect x={-132} y={-64} width={264} height={58} rx={12} fill={C.cream} {...O} />
    {Array.from({ length: 11 }, (_, i) => <rect key={i} x={-118 + i * 22} y={-61} width={12} height={52} fill={cols[i % 4]} />)}
    <rect x={-132} y={-64} width={264} height={58} rx={12} fill="none" {...O} />
    {[-138, 132].map((x) => <path key={x} d={[-56, -44, -32, -20].map((y) => `M${x},${y}h6`).join(' ')} stroke={INK} strokeWidth={2} strokeLinecap="round" />)}
  </g>;
};

const rugRect: FurnitureArtFn = ({ a, b }) => <g>
  <rect x={-122} y={-58} width={244} height={54} rx={6} fill={a} {...O} />
  <rect x={-110} y={-50} width={220} height={38} rx={4} fill={C.cream} {...T} />
  {[-80, -40, 0, 40, 80].map((x, i) => <path key={x} d={`M${x},-43 l13,12 l-13,12 l-13,-12Z`} fill={i % 2 ? b : C.sun} {...T} strokeWidth={1.5} />)}
  {[-122, 122].map((x) => <path key={x} d={[-52, -40, -28, -16].map((y) => `M${x},${y}h${x < 0 ? -6 : 6}`).join(' ')} stroke={INK} strokeWidth={2} strokeLinecap="round" />)}
</g>;

const rugFluffy: FurnitureArtFn = ({ a }) => <g>
  {Array.from({ length: 22 }, (_, i) => {
    const t = (i / 22) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(t) * 98} cy={-30 + Math.sin(t) * 24} r={10} fill={shade(a, 0.4)} {...T} />;
  })}
  <ellipse cx={0} cy={-30} rx={100} ry={26} fill={shade(a, 0.4)} />
  <ellipse cx={0} cy={-30} rx={70} ry={14} fill={shade(a, 0.6)} />
  {[-40, -10, 25, 55].map((x, i) => <path key={x} d={`M${x},${-32 + (i % 2) * 6} q4,-5 8,0`} fill="none" stroke={shade(a, 0.1)} strokeWidth={2} strokeLinecap="round" />)}
</g>;

// ---------- plants ----------
function MonsteraLeaf({ x, y, rot, s, fill, st }: { x: number; y: number; rot: number; s: number; fill: string; st: PlantState }) {
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0,0 C-26,-4 -34,-38 -12,-56 Q0,-62 12,-56 C34,-38 26,-4 0,0Z" fill={fill} {...O} />
    <path d="M0,-4 V-52 M-22,-24 l10,4 M22,-24 l-10,4 M-20,-40 l9,6 M20,-40 l-9,6" stroke={vein(st)} strokeWidth={2.2} strokeLinecap="round" />
  </g>;
}

const plantMonstera: FurnitureArtFn = ({ a, state }) => {
  const st = plantState(state);
  const droop = st === 'dry' ? 1.5 : 1;
  const leaves: [number, number, number, number][] = [[-30, -66, -60, 0.8], [30, -68, 62, 0.8], [-20, -82, -28, 0.95], [22, -84, 30, 0.95], [0, -90, 0, 1]];
  return <g>
    <Shadow rx={30} />
    {leaves.map(([x, y], i) => <Tube key={`s${i}`} d={`M0,-54 Q${x * 0.3},${(y - 54) / 2 - 10} ${x},${y + (st === 'dry' ? 8 : 0)}`} c={st === 'dry' ? '#a99140' : C.green} w={3} />)}
    {leaves.map(([x, y, r, s], i) => <MonsteraLeaf key={i} x={x} y={y + (st === 'dry' ? 8 : 0)} rot={r * droop} s={s * (st === 'dry' ? 0.92 : 1)} fill={leaf(st, i)} st={st} />)}
    {state === 'watered' && <Dew pts={[[-30, -110], [26, -104], [4, -128]]} />}
    {st === 'bloom' && <>
      <Flower x={-36} y={-112} r={7} c={C.pink} /><Flower x={34} y={-118} r={7} c="#fff" /><Flower x={6} y={-136} r={8} c={C.coral} />
    </>}
    <path d="M-30,-50 L30,-50 L23,0 L-23,0Z" fill={a} {...O} />
    <path d="M-26,-30 q6,-6 12,0 t12,0 t12,0 t12,0" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    <rect x={-35} y={-60} width={70} height={13} rx={5} fill={shade(a, -0.2)} {...O} />
    <Soil rx={26} y={-60} st={st} />
    {st === 'dry' && <FallenLeaf x={34} y={-3} />}
  </g>;
};

const plantCactus: FurnitureArtFn = ({ b, state }) => {
  const st = plantState(state);
  const g = st === 'dry' ? '#a9b44a' : C.green;
  return <g>
    <Shadow rx={22} />
    <Tube d="M-12,-56 q-16,0 -16,-16 v-8" c={g} w={10} />
    <Tube d="M12,-64 q14,0 14,-12 v-4" c={g} w={9} />
    <rect x={-13} y={-88} width={26} height={60} rx={13} fill={g} {...O} />
    <path d="M-4,-80 v44 M5,-80 v44" stroke={shade(g, -0.25)} strokeWidth={2} />
    {[[-9, -72], [9, -60], [-8, -48], [8, -78]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x},${y} l${x < 0 ? -4 : 4},-2`} stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />)}
    {st === 'bloom' ? <Flower x={0} y={-88} r={6} c={C.pink} /> : st === 'watered' ? <ellipse cx={0} cy={-89} rx={4} ry={5} fill={C.pink} {...T} /> : null}
    {state === 'watered' && <Dew pts={[[-30, -78], [27, -82]]} />}
    <path d="M-22,-32 L22,-32 L17,0 L-17,0Z" fill={b} {...O} />
    <rect x={-25} y={-38} width={50} height={10} rx={4} fill={shade(b, -0.2)} {...O} />
  </g>;
};

const flowerPot: FurnitureArtFn = ({ a, state }) => {
  const st = plantState(state, 'bloom');
  const heads: [number, number, string][] = [[-14, -72, C.pink], [12, -80, C.sun], [0, -62, C.grape], [17, -58, C.coral]];
  return <g>
    <Shadow rx={24} />
    {heads.map(([x, y], i) => <path key={i} d={st === 'dry' ? `M${x * 0.4},-36 Q${x},${y + 4} ${x + (x < 0 ? -8 : 8)},${y + 16}` : `M${x * 0.4},-36 Q${x * 0.8},${(y - 36) / 2} ${x},${y}`} fill="none" stroke={st === 'dry' ? '#9c8440' : C.green} strokeWidth={3.5} strokeLinecap="round" />)}
    {[[-10, -48, -40], [10, -50, 40]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={9} ry={4.5} fill={leaf(st, 0)} {...T} transform={`rotate(${r} ${x} ${y})`} />)}
    {heads.map(([x, y, c], i) => st === 'bloom'
      ? <Flower key={i} x={x} y={y} r={6.5} c={c} />
      : st === 'watered'
        ? <ellipse key={i} cx={x} cy={y} rx={4} ry={6} fill={C.lime} {...T} />
        : <circle key={i} cx={x + (x < 0 ? -8 : 8)} cy={y + 18} r={4} fill="#b58d55" {...T} />)}
    {state === 'watered' && <Dew pts={[[-22, -56], [22, -66]]} />}
    <path d="M-24,-34 L24,-34 L18,0 L-18,0Z" fill={a} {...O} />
    <path d={heart(0, -18, 7)} fill="#fff" />
    <rect x={-27} y={-40} width={54} height={10} rx={4} fill={shade(a, -0.2)} {...O} />
    {st === 'dry' && <FallenLeaf x={24} y={-3} />}
  </g>;
};

const hangingPlant: FurnitureArtFn = ({ a, state }) => {
  const st = plantState(state);
  const vines = st === 'dry' ? [[-18, -38], [-6, -30], [8, -34], [20, -40]] : [[-18, -2], [-6, 10], [8, 4], [20, -6]];
  return <g>
    <path d="M0,-128 L-20,-62 M0,-128 L20,-62 M0,-128 L0,-62" stroke={INK} strokeWidth={2} />
    <circle cx={0} cy={-128} r={4} fill={C.wood} {...T} />
    {vines.map(([x, end], i) => <path key={x} d={`M${x},-44 Q${x + (i % 2 ? 12 : -12)},${(end - 44) / 2} ${x + (i % 2 ? 4 : -4)},${end}`} fill="none" stroke={st === 'dry' ? '#a99140' : C.green} strokeWidth={3.5} strokeLinecap="round" />)}
    {vines.flatMap(([x, end], i) => [0.35, 0.7, 1].map((t, j) => <ellipse key={`${i}${j}`} cx={x + (i % 2 ? 6 : -6) * (1 - Math.abs(t - 0.5))} cy={-44 + (end + 44) * t} rx={6} ry={4} fill={leaf(st, i + j)} {...T} strokeWidth={1.5} transform={`rotate(${i % 2 ? 30 : -30} ${x} ${-44 + (end + 44) * t})`} />))}
    {st === 'bloom' && <><Flower x={-20} y={-8} r={5} c={C.pink} /><Flower x={22} y={-12} r={5} c="#fff" /><Flower x={-4} y={4} r={5} c={C.sun} /></>}
    <path d="M-26,-62 L26,-62 Q24,-32 0,-32 Q-24,-32 -26,-62Z" fill={a} {...O} />
    <path d="M-20,-50 H20" stroke="#fff" strokeWidth={3} strokeDasharray="2 6" strokeLinecap="round" />
    <Soil rx={22} y={-62} st={st} />
  </g>;
};

// ---------- mirrors & wall pictures ----------
const mirrorTall: FurnitureArtFn = () => <g>
  <Shadow rx={34} />
  <path d="M-30,0 l10,-40 M30,0 l-10,-40" stroke={INK} strokeWidth={7} strokeLinecap="round" />
  <path d="M-30,0 l10,-40 M30,0 l-10,-40" stroke={C.woodDark} strokeWidth={3.5} strokeLinecap="round" />
  <rect x={-42} y={-198} width={84} height={186} rx={42} fill={C.sun} {...O} />
  <rect x={-32} y={-188} width={64} height={166} rx={32} fill="#bfe6ff" {...T} />
  <path d="M-32,-60 Q0,-80 32,-66 V-48 Q32,-22 0,-22 Q-32,-22 -32,-48Z" fill="#9fd4f5" />
  <Shine d="M-18,-120 L12,-156" w={6} /><Shine d="M-14,-96 L16,-132" w={4} />
  <path d={star4(0, -196, 7)} fill="#fff" {...T} strokeWidth={1.5} />
</g>;

const mirrorRound: FurnitureArtFn = () => <g>
  {Array.from({ length: 12 }, (_, i) => {
    const t = (i / 12) * Math.PI * 2;
    const x = Math.cos(t), y = Math.sin(t);
    return <path key={i} d={`M${x * 36 - y * 8},${-50 + y * 36 + x * 8} L${x * 49},${-50 + y * 49} L${x * 36 + y * 8},${-50 + y * 36 - x * 8}Z`} fill={i % 2 ? C.orange : C.sun} {...T} />;
  })}
  <circle cx={0} cy={-50} r={38} fill={C.sun} {...O} />
  <circle cx={0} cy={-50} r={29} fill="#bfe6ff" {...T} />
  <Shine d="M-16,-56 L2,-74" w={5} /><Shine d="M-8,-44 L10,-62" w={3} />
</g>;

const archMirror: FurnitureArtFn = ({ a }) => <g>
  <path d="M-38,-4 L-38,-80 A38,38 0 0,1 38,-80 L38,-4 Z" fill={a} {...O} />
  <path d="M-29,-12 L-29,-80 A29,29 0 0,1 29,-80 L29,-12 Z" fill="#bfe6ff" {...T} />
  <Shine d="M-12,-72 l16,-16" w={5} /><Shine d="M-6,-56 l16,-16" w={3} />
  <rect x={-44} y={-12} width={88} height={10} rx={4} fill={shade(a, -0.2)} {...O} />
  <circle cx={0} cy={-112} r={5} fill={C.sun} {...T} />
</g>;

const frame: FurnitureArtFn = ({ a }) => <g>
  <rect x={-38} y={-93} width={76} height={90} rx={6} fill={a} {...O} />
  <rect x={-28} y={-83} width={56} height={70} rx={2} fill="#8fd3ff" {...T} />
  <circle cx={12} cy={-64} r={8} fill={C.sun} {...T} strokeWidth={1.6} />
  <path d="M-28,-30 Q-14,-52 2,-34 Q14,-48 28,-32 V-13 H-28Z" fill={C.green} {...T} />
  <path d="M-28,-22 Q0,-30 28,-22 V-13 H-28Z" fill={C.lime} {...T} strokeWidth={1.6} />
  <path d="M-18,-70 q4,-4 8,0 q4,-4 8,0" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
</g>;

const poster: FurnitureArtFn = ({ b }) => <g>
  <rect x={-44} y={-118} width={88} height={114} rx={6} fill={C.sun} {...O} />
  <circle cx={0} cy={-70} r={30} fill={b} {...T} />
  <ellipse cx={-21} cy={-74} rx={8} ry={14} fill={C.woodDark} {...T} />
  <ellipse cx={21} cy={-74} rx={8} ry={14} fill={C.woodDark} {...T} />
  <circle cx={0} cy={-68} r={20} fill={C.wood} {...T} />
  <circle cx={-7} cy={-72} r={3} fill={INK} /><circle cx={7} cy={-72} r={3} fill={INK} />
  <ellipse cx={0} cy={-63} rx={4.5} ry={3.2} fill={INK} />
  <path d="M-4,-58 q4,4 8,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
  <rect x={-30} y={-30} width={60} height={9} rx={4.5} fill={C.red} />
  <rect x={-20} y={-17} width={40} height={6} rx={3} fill="#fff" />
  <rect x={-50} y={-124} width={18} height={9} rx={2} fill="#fff" opacity={0.85} transform="rotate(-20 -41 -120)" />
  <rect x={32} y={-124} width={18} height={9} rx={2} fill="#fff" opacity={0.85} transform="rotate(20 41 -120)" />
</g>;

const clock: FurnitureArtFn = ({ a }) => <g>
  <circle cx={0} cy={-35} r={33} fill={a} {...O} />
  <circle cx={0} cy={-35} r={25} fill="#fff" {...T} />
  {Array.from({ length: 12 }, (_, i) => {
    const t = (i / 12) * Math.PI * 2;
    return <circle key={i} cx={Math.sin(t) * 19} cy={-35 - Math.cos(t) * 19} r={i % 3 ? 1.4 : 2.4} fill={INK} />;
  })}
  <path d="M0,-35 L0,-50 M0,-35 L11,-30" stroke={INK} strokeWidth={3} strokeLinecap="round" />
  <circle cx={0} cy={-35} r={2.6} fill={C.red} />
  <Shine d="M-24,-52 Q-18,-62 -8,-65" w={3} />
</g>;

const balloons: FurnitureArtFn = ({ a, b }) => <g>
  {([[-22, -160, a], [20, -176, C.sun], [0, -128, b], [28, -128, C.red]] as [number, number, string][]).map(([x, y, c], i) => <g key={i}>
    <path d={`M${x},${y + 30} Q${x + 8},${(y + 30) / 2} 0,-8`} fill="none" stroke={INK} strokeWidth={1.6} />
    <ellipse cx={x} cy={y} rx={21} ry={26} fill={c} {...O} />
    <ellipse cx={x - 8} cy={y - 10} rx={4.5} ry={8} fill="#fff" opacity={0.6} />
    <path d={`M${x - 4},${y + 29} l4,-4 l4,4Z`} fill={c} {...T} />
  </g>)}
  <rect x={-11} y={-12} width={22} height={12} rx={3} fill={C.pink} {...O} />
</g>;

// ---------- shelves ----------
const Plank = ({ x, y, w }: { x: number; y: number; w: number }) => <g>
  <rect x={x} y={y} width={w} height={10} rx={3} fill={C.wood} {...O} />
  <path d={`M${x + 18},${y + 10} l0,10 l12,-10Z M${x + w - 18},${y + 10} l0,10 l-12,-10Z`} fill={C.woodDark} {...T} />
</g>;

const shelf: FurnitureArtFn = ({ a, b }) => <g>
  <Plank x={-84} y={-14} w={168} />
  {([[-72, 30, a], [-42, 38, b], [-12, 26, C.pink], [16, 34, C.sun]] as [number, number, string][]).map(([x, h, c], i) => <g key={i}>
    <rect x={x} y={-14 - h} width={28} height={h} rx={6} fill={c} {...O} strokeWidth={2.4} />
    <path d={`M${x + 4},${-14 - h + 8}h20`} stroke="#fff" strokeWidth={2} opacity={0.7} />
  </g>)}
  <rect x={50} y={-34} width={28} height={20} rx={4} fill={C.wood} {...T} />
  <path d="M52,-28h24" stroke={C.woodDark} strokeWidth={2} />
  <Plank x={-84} y={-80} w={168} />
  <path d="M-62,-80 h28 l-4,-12 h-20Z" fill={C.mint} {...T} />
  <circle cx={18} cy={-87} r={7} fill={C.red} {...T} />
  <circle cx={34} cy={-86} r={6} fill={a} {...T} />
</g>;

const wallShelves: FurnitureArtFn = ({ a }) => <g>
  <Plank x={-72} y={-58} w={144} />
  <Plank x={-72} y={-8} w={144} />
  <rect x={-62} y={-88} width={14} height={30} rx={2} fill={a} {...T} />
  <rect x={-47} y={-84} width={12} height={26} rx={2} fill={C.sun} {...T} />
  <rect x={-34} y={-90} width={14} height={32} rx={2} fill={C.sky} {...T} transform="rotate(8 -27 -58)" />
  <path d="M0,-58 h22 l-3,-14 h-16Z" fill={C.coral} {...T} />
  <circle cx={6} cy={-78} r={6} fill={C.green} {...T} /><circle cx={16} cy={-80} r={7} fill={C.lime} {...T} />
  <path d={star4(50, -72, 12)} fill={C.sun} {...T} />
  <rect x={-54} y={-34} width={34} height={26} rx={5} fill="#fff" {...T} />
  <path d={heart(-37, -22, 6)} fill={C.pink} />
  <circle cx={30} cy={-20} r={12} fill={C.red} {...T} />
  <path d="M18,-20 h24 M30,-32 q-7,12 0,24" fill="none" stroke="#fff" strokeWidth={2} />
</g>;

// ---------- lighting ----------
const lampOn = (s?: string) => s === 'on';
const floorLamp: FurnitureArtFn = ({ a, state }) => {
  const on = lampOn(state);
  return <g>
    <Shadow rx={28} />
    {on && <Glow d="M-30,-132 L30,-132 L74,-6 L-74,-6Z"><circle cx={0} cy={-152} r={46} fill={GLOW} opacity={0.4} /></Glow>}
    <ellipse cx={0} cy={-7} rx={24} ry={7} fill={C.charcoal} {...O} />
    <rect x={-3.5} y={-140} width={7} height={132} rx={3} fill={C.charcoal} {...T} />
    <path d="M-34,-132 L-22,-178 L22,-178 L34,-132Z" fill={a} {...O} />
    <path d="M-30,-146 H30" stroke="#fff" strokeWidth={3} opacity={0.6} />
    <ellipse cx={0} cy={-128} rx={9} ry={6} fill={on ? GLOW : '#d7d9e0'} {...T} />
    <path d="M14,-130 v22" stroke={INK} strokeWidth={1.6} /><circle cx={14} cy={-106} r={3} fill={C.sun} {...T} strokeWidth={1.2} />
  </g>;
};

const sideLamp: FurnitureArtFn = ({ a, b, state }) => {
  const on = lampOn(state);
  return <g>
    <Shadow rx={34} />
    {on && <Glow d="M-22,-96 L22,-96 L42,-64 L-42,-64Z"><circle cx={0} cy={-110} r={34} fill={GLOW} opacity={0.4} /></Glow>}
    <path d="M-24,-52 L-26,0 M24,-52 L26,0" stroke={INK} strokeWidth={7} strokeLinecap="round" />
    <path d="M-24,-52 L-26,0 M24,-52 L26,0" stroke={C.woodDark} strokeWidth={3.5} strokeLinecap="round" />
    <rect x={-26} y={-28} width={52} height={7} rx={3} fill={C.wood} {...T} />
    <rect x={-32} y={-62} width={64} height={11} rx={4} fill={C.wood} {...O} />
    <path d="M-10,-62 Q-14,-80 0,-82 Q14,-80 10,-62Z" fill={b} {...O} />
    <path d="M-24,-94 L-14,-126 L14,-126 L24,-94Z" fill={a} {...O} />
    <ellipse cx={0} cy={-91} rx={7} ry={4} fill={on ? GLOW : '#d7d9e0'} {...T} />
  </g>;
};

const wallLamp: FurnitureArtFn = ({ a, state }) => {
  const on = lampOn(state);
  return <g>
    {on && <Glow d="M2,-58 L30,-58 L46,-10 L-14,-10Z"><circle cx={16} cy={-66} r={22} fill={GLOW} opacity={0.4} /></Glow>}
    <rect x={-9} y={-48} width={18} height={24} rx={5} fill={C.wood} {...O} />
    <path d="M0,-38 Q-2,-62 14,-64" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    <path d="M-4,-58 L36,-58 L27,-80 L5,-80 Z" fill={a} {...O} />
    <ellipse cx={16} cy={-56} rx={6} ry={3.5} fill={on ? GLOW : '#d7d9e0'} {...T} />
  </g>;
};

const deskLamp: FurnitureArtFn = ({ a, state }) => {
  const on = lampOn(state);
  return <g>
    {on && <Glow d="M4,-36 L22,-46 L40,-2 L-10,-2Z"><circle cx={12} cy={-42} r={16} fill={GLOW} opacity={0.5} /></Glow>}
    <ellipse cx={-8} cy={-5} rx={16} ry={5} fill={a} {...O} />
    <Tube d="M-8,-8 L-14,-34 L6,-50" c={a} w={4} />
    <circle cx={-14} cy={-34} r={3.5} fill={C.sun} {...T} />
    <path d="M0,-58 L18,-46 L10,-34 L-6,-48Z" fill={a} {...O} transform="rotate(10 6 -46)" />
    <circle cx={13} cy={-39} r={4} fill={on ? GLOW : '#d7d9e0'} {...T} />
  </g>;
};

// ---------- new studio props ----------
const books: FurnitureArtFn = () => <g>
  <Shadow rx={28} />
  {([[54, 12, C.red, 0], [46, 12, C.sky, 3], [50, 12, C.sun, -2], [40, 12, C.green, 2]] as [number, number, string, number][]).map(([w, h, c, dx], i) => {
    const y = -4 - (i + 1) * 11.5;
    return <g key={i}>
      <rect x={-w / 2 + dx} y={y} width={w} height={h} rx={2.5} fill={c} {...T} />
      <path d={`M${w / 2 + dx - 6},${y + 2.5} v7`} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <path d={`M${-w / 2 + dx + 6},${y + 6} h${w * 0.35}`} stroke={shade(c, -0.3)} strokeWidth={2} strokeLinecap="round" />
    </g>;
  })}
</g>;

const toyBox: FurnitureArtFn = () => <g>
  <Shadow rx={54} />
  <rect x={-50} y={-64} width={100} height={60} rx={6} fill={C.sky} {...O} />
  {([[-36, C.red, 'A'], [-10, C.sun, 'B'], [16, C.green, 'C']] as [number, string, string][]).map(([x, c, l]) => <g key={x}>
    <rect x={x} y={-50} width={22} height={22} rx={4} fill={c} {...T} />
    <text x={x + 11} y={-33} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" fontFamily="Rubik, Arial, sans-serif">{l}</text>
  </g>)}
  <path d="M-40,-16 h80" stroke="#fff" strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
  <rect x={-55} y={-76} width={110} height={14} rx={6} fill={C.red} {...O} />
  <rect x={-10} y={-70} width={20} height={5} rx={2.5} fill={C.sun} {...T} strokeWidth={1.4} />
</g>;

const teddy: FurnitureArtFn = () => {
  const fur = '#c9824f', light = '#f4cf9e';
  return <g>
    <Shadow rx={26} />
    <ellipse cx={-14} cy={-10} rx={11} ry={8} fill={fur} {...T} /><ellipse cx={14} cy={-10} rx={11} ry={8} fill={fur} {...T} />
    <ellipse cx={0} cy={-26} rx={19} ry={20} fill={fur} {...O} />
    <ellipse cx={0} cy={-22} rx={11} ry={12} fill={light} />
    <ellipse cx={-18} cy={-30} rx={6} ry={11} fill={fur} {...T} transform="rotate(25 -18 -30)" />
    <ellipse cx={18} cy={-30} rx={6} ry={11} fill={fur} {...T} transform="rotate(-25 18 -30)" />
    <circle cx={-13} cy={-64} r={6} fill={fur} {...T} /><circle cx={13} cy={-64} r={6} fill={fur} {...T} />
    <circle cx={-13} cy={-64} r={2.6} fill={light} /><circle cx={13} cy={-64} r={2.6} fill={light} />
    <circle cx={0} cy={-52} r={16} fill={fur} {...O} />
    <ellipse cx={0} cy={-47} rx={7} ry={5.5} fill={light} {...T} strokeWidth={1.4} />
    <ellipse cx={0} cy={-49} rx={2.6} ry={2} fill={INK} />
    <circle cx={-6} cy={-55} r={2} fill={INK} /><circle cx={6} cy={-55} r={2} fill={INK} />
    <path d="M-10,-38 l10,4 l10,-4 l-2,8 l-8,-3 l-8,3Z" fill={C.red} {...T} strokeWidth={1.5} />
  </g>;
};

const beanbag: FurnitureArtFn = () => <g>
  <Shadow rx={54} />
  <path d="M-52,-12 Q-62,-58 -24,-72 Q10,-82 40,-62 Q60,-46 52,-12 Q48,-2 0,-2 Q-48,-2 -52,-12Z" fill={C.orange} {...O} />
  <path d="M-36,-44 Q0,-30 36,-44" fill="none" stroke={shade(C.orange, -0.25)} strokeWidth={3} strokeLinecap="round" />
  <path d="M-20,-70 Q-14,-50 -4,-40 M22,-68 Q16,-52 8,-40" fill="none" stroke={shade(C.orange, -0.2)} strokeWidth={2.4} strokeLinecap="round" />
  <Shine d="M-44,-34 Q-46,-56 -28,-64" />
  <path d={star4(30, -22, 7)} fill={C.sun} {...T} strokeWidth={1.4} />
</g>;

const radio: FurnitureArtFn = ({ state }) => {
  const on = state === 'on';
  return <g>
    <Shadow rx={30} />
    <path d="M18,-42 L30,-50" stroke={INK} strokeWidth={2.4} strokeLinecap="round" /><circle cx={30} cy={-50} r={2.4} fill={C.red} />
    <path d="M-20,-42 Q-20,-50 -12,-50 H12 Q20,-50 20,-42" fill="none" stroke={INK} strokeWidth={4} />
    <rect x={-32} y={-42} width={64} height={38} rx={9} fill={C.mint} {...O} />
    <circle cx={-14} cy={-23} r={12} fill={C.cream} {...T} />
    {[-6, -1, 4].map((dy) => <path key={dy} d={`M-22,${-23 + dy} h16`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />)}
    <rect x={4} y={-34} width={22} height={10} rx={3} fill={on ? C.sun : C.charcoal} {...T} />
    <path d="M10,-34 v10" stroke={C.red} strokeWidth={2} />
    <circle cx={9} cy={-15} r={4} fill={C.red} {...T} strokeWidth={1.4} /><circle cx={21} cy={-15} r={4} fill={C.sun} {...T} strokeWidth={1.4} />
    {on && <Notes x={-6} y={-56} />}
  </g>;
};

const tv: FurnitureArtFn = ({ state }) => {
  const on = state === 'on';
  return <g>
    <Shadow rx={48} />
    <path d="M-8,-74 L-22,-86 M8,-74 L22,-86" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
    <circle cx={-22} cy={-86} r={3} fill={C.sun} {...T} strokeWidth={1.2} /><circle cx={22} cy={-86} r={3} fill={C.sun} {...T} strokeWidth={1.2} />
    <path d="M-36,-8 l-4,8 M36,-8 l4,8" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <rect x={-50} y={-76} width={100} height={68} rx={14} fill={C.red} {...O} />
    <rect x={-40} y={-67} width={64} height={50} rx={10} fill={on ? '#8fe3ff' : C.charcoal} {...T} />
    {on ? <g className="kg-fx-tv">
      <circle cx={8} cy={-54} r={7} fill={C.sun} {...T} strokeWidth={1.4} />
      <path d="M-40,-30 Q-24,-46 -8,-32 Q6,-42 24,-30 V-27 Q24,-17 14,-17 H-30 Q-40,-17 -40,-27Z" fill={C.green} {...T} strokeWidth={1.4} />
      <path d={heart(-20, -52, 6)} fill={C.pink} {...T} strokeWidth={1.2} />
    </g> : <Shine d="M-32,-58 l10,-6 M-32,-48 l18,-11" w={3} />}
    {on && <rect x={-46} y={-73} width={76} height={62} rx={14} fill={GLOW} opacity={0.25} className="kg-fx-glow" pointerEvents="none" />}
    <circle cx={37} cy={-56} r={5} fill={C.sun} {...T} /><circle cx={37} cy={-40} r={5} fill={C.cream} {...T} />
    {[-28, -24, -20].map((y) => <path key={y} d={`M32,${y} h10`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />)}
  </g>;
};

const PotPlant = ({ st, pot, w, h, children }: { st: PlantState; pot: string; w: number; h: number; children: ReactNode }) => <g>
  <Shadow rx={w / 2} />
  {children}
  <path d={`M${-w / 2},${-h} L${w / 2},${-h} L${w / 2 - 4},0 L${-w / 2 + 4},0Z`} fill={pot} {...O} />
  <rect x={-w / 2 - 3} y={-h - 6} width={w + 6} height={8} rx={3} fill={shade(pot, -0.2)} {...O} />
  <Soil rx={w / 2 - 2} y={-h - 6} st={st} />
</g>;

const plantSmall: FurnitureArtFn = ({ state }) => {
  const st = plantState(state);
  const d = st === 'dry' ? 20 : 0;
  return <PotPlant st={st} pot={C.coral} w={26} h={16}>
    {[[-10, -36, -40 - d], [10, -36, 40 + d], [0, -42, 0], [-4, -30, -70 - d], [5, -30, 70 + d]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y + (st === 'dry' ? 4 : 0)} rx={6} ry={11} fill={leaf(st, i)} {...T} transform={`rotate(${r} ${x} ${y + 10})`} />)}
    {st === 'bloom' && <><Flower x={0} y={-46} r={4.5} c={C.pink} /><Flower x={-11} y={-38} r={4} c="#fff" /></>}
    {state === 'watered' && <Dew pts={[[12, -42]]} />}
  </PotPlant>;
};

const plantTall: FurnitureArtFn = ({ state }) => {
  const st = plantState(state);
  const pts: [number, number, number][] = [[-22, -150, -30], [18, -146, 30], [-2, -158, 0], [-26, -122, -50], [24, -118, 50], [-18, -96, -40], [20, -92, 45], [0, -132, 10], [-6, -110, -10]];
  const droop = st === 'dry' ? 22 : 0;
  return <g>
    <Shadow rx={34} />
    <Tube d="M0,-46 Q-4,-100 0,-150" c={C.woodDark} w={4} />
    {pts.map(([x, y, r], i) => <g key={i} transform={`rotate(${r + (r < 0 ? -droop : droop)} ${x} ${y + 12})`}>
      <path d={`M${x},${y + 14} C${x - 13},${y + 4} ${x - 11},${y - 14} ${x},${y - 14} C${x + 11},${y - 14} ${x + 13},${y + 4} ${x},${y + 14}Z`} fill={leaf(st, i)} {...T} strokeWidth={2.2} />
      <path d={`M${x},${y + 12} V${y - 8}`} stroke={vein(st)} strokeWidth={1.6} />
    </g>)}
    {st === 'bloom' && <><Flower x={-22} y={-164} r={6} c={C.pink} /><Flower x={20} y={-140} r={6} c={C.sun} /><Flower x={-28} y={-112} r={5.5} c="#fff" /><Flower x={26} y={-104} r={5.5} c={C.coral} /></>}
    {state === 'watered' && <Dew pts={[[-30, -132], [30, -128], [4, -100]]} />}
    <path d="M-30,-48 L30,-48 L24,0 L-24,0Z" fill="#fff" {...O} />
    {[-36, -24, -12].map((y) => <path key={y} d={`M${-29 + (y + 48) * 0.12},${y} H${29 - (y + 48) * 0.12}`} stroke={C.blue} strokeWidth={4} />)}
    <rect x={-33} y={-54} width={66} height={9} rx={4} fill="#fff" {...O} />
    <Soil rx={28} y={-54} st={st} />
    {st === 'dry' && <><FallenLeaf x={-34} y={-3} /><FallenLeaf x={30} y={-2} /></>}
  </g>;
};

const succulent: FurnitureArtFn = ({ state }) => {
  const st = plantState(state);
  const g = st === 'dry' ? '#b9b25a' : C.mint;
  return <PotPlant st={st} pot={C.sky} w={30} h={12}>
    {st === 'bloom' && <><path d="M4,-26 Q8,-36 6,-44" fill="none" stroke={C.green} strokeWidth={2.5} /><Flower x={6} y={-44} r={4} c={C.orange} /></>}
    {[-50, -20, 20, 50, 0].map((r, i) => <path key={i} d="M0,-18 Q-7,-24 0,-34 Q7,-24 0,-18Z" fill={i === 4 ? shade(g, 0.25) : g} {...T} strokeWidth={1.8} transform={`rotate(${r * (st === 'dry' ? 1.4 : 1)} 0 -18)`} />)}
    {state === 'watered' && <Dew pts={[[-12, -26]]} />}
  </PotPlant>;
};

const vase: FurnitureArtFn = ({ state }) => {
  const st = plantState(state, 'bloom');
  const tips: [number, number, string][] = [[-12, -60, C.red], [2, -68, C.sun], [14, -58, C.pink]];
  return <g>
    <Shadow rx={18} />
    {tips.map(([x, y], i) => <path key={i} d={st === 'dry' ? `M${x * 0.3},-36 Q${x},${y + 2} ${x + (x < 0 ? -9 : 9)},${y + 16}` : `M${x * 0.3},-36 Q${x * 0.7},${(y - 36) / 2} ${x},${y}`} fill="none" stroke={st === 'dry' ? '#9c8440' : C.green} strokeWidth={3} strokeLinecap="round" />)}
    <ellipse cx={-10} cy={-44} rx={8} ry={3.5} fill={leaf(st)} {...T} strokeWidth={1.5} transform="rotate(-35 -10 -44)" />
    {tips.map(([x, y, c], i) => st === 'bloom'
      ? <path key={i} d={`M${x - 6},${y + 4} Q${x - 7},${y - 8} ${x - 3},${y - 8} L${x},${y - 3} L${x + 3},${y - 8} Q${x + 7},${y - 8} ${x + 6},${y + 4} Q${x},${y + 8} ${x - 6},${y + 4}Z`} fill={c} {...T} strokeWidth={1.6} />
      : st === 'watered'
        ? <ellipse key={i} cx={x} cy={y} rx={3.5} ry={6} fill={C.lime} {...T} strokeWidth={1.5} />
        : <circle key={i} cx={x + (x < 0 ? -9 : 9)} cy={y + 18} r={3.5} fill="#b58d55" {...T} strokeWidth={1.4} />)}
    <path d="M-10,-38 Q-20,-24 -16,-8 Q-14,-2 0,-2 Q14,-2 16,-8 Q20,-24 10,-38Z" fill={C.blue} {...O} />
    <rect x={-11} y={-42} width={22} height={6} rx={3} fill={shade(C.blue, 0.3)} {...T} />
    <Shine d="M-10,-26 Q-12,-16 -8,-10" w={3} />
    {state === 'watered' && <Dew pts={[[16, -48]]} />}
  </g>;
};

const cactusSmall: FurnitureArtFn = ({ state }) => {
  const st = plantState(state);
  const g = st === 'dry' ? '#a9b44a' : C.green;
  return <PotPlant st={st} pot={C.pink} w={24} h={14}>
    <ellipse cx={0} cy={-30} rx={11} ry={13} fill={g} {...T} strokeWidth={2.2} />
    <path d="M-4,-40 Q-6,-30 -4,-20 M4,-40 Q6,-30 4,-20" fill="none" stroke={shade(g, -0.25)} strokeWidth={1.4} />
    {st === 'bloom' ? <Flower x={0} y={-43} r={4} c={C.sun} center={C.orange} /> : state === 'watered' ? <Dew pts={[[13, -38]]} /> : null}
  </PotPlant>;
};

const wallClock: FurnitureArtFn = () => <g>
  <path d="M0,-34 V-10" stroke={INK} strokeWidth={2} />
  <path d="M0,-10 l-7,6 h14Z" fill={C.sun} {...T} strokeWidth={1.6} />
  <circle cx={0} cy={-6} r={6} fill={C.sun} {...T} />
  <rect x={-24} y={-70} width={48} height={40} rx={6} fill={C.sky} {...O} />
  <path d="M-30,-68 L0,-90 L30,-68Z" fill={C.red} {...O} />
  <circle cx={0} cy={-50} r={14} fill="#fff" {...T} />
  <path d="M0,-50 V-60 M0,-50 L7,-46" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
  <circle cx={0} cy={-78} r={4} fill={C.sun} {...T} strokeWidth={1.4} />
</g>;

const toyShelf: FurnitureArtFn = () => <g>
  <rect x={-68} y={-74} width={136} height={68} rx={6} fill={C.wood} {...O} />
  {[-62, -18, 26].map((x) => <rect key={x} x={x} y={-66} width={38} height={52} rx={4} fill={shade(C.wood, 0.5)} {...T} />)}
  <circle cx={-43} cy={-26} r={11} fill={C.red} {...T} /><path d="M-54,-26 h22 M-43,-37 q-7,11 0,22" fill="none" stroke="#fff" strokeWidth={2} />
  <path d="M-12,-14 v-12 q0,-6 6,-6 h8 l4,-8 h8 l4,8 q4,0 4,6 v12Z" fill={C.blue} {...T} />
  <circle cx={-4} cy={-14} r={4} fill={INK} /><circle cx={14} cy={-14} r={4} fill={INK} />
  <ellipse cx={45} cy={-24} rx={11} ry={9} fill={C.sun} {...T} />
  <circle cx={52} cy={-36} r={7} fill={C.sun} {...T} />
  <path d="M58,-36 l6,2 l-6,2Z" fill={C.orange} {...T} strokeWidth={1.2} /><circle cx={54} cy={-38} r={1.4} fill={INK} />
  <rect x={-72} y={-80} width={144} height={9} rx={4} fill={C.woodDark} {...O} />
</g>;

const Tape = () => <>
  <rect x={-8} y={-106} width={16} height={8} rx={2} fill="#fff" opacity={0.85} />
</>;
const posterRainbow: FurnitureArtFn = () => <g>
  <rect x={-38} y={-100} width={76} height={96} rx={5} fill="#fff" {...O} />
  {[C.red, C.orange, C.sun, C.green, C.sky].map((c, i) => <path key={c} d={`M${-30 + i * 6},-36 A${30 - i * 6},${30 - i * 6} 0 0 1 ${30 - i * 6},-36`} fill="none" stroke={c} strokeWidth={6} />)}
  <path d="M-34,-36 q0,-10 10,-10 q4,-8 12,-4 q8,2 6,14Z M34,-36 q0,-10 -10,-10 q-4,-8 -12,-4 q-8,2 -6,14Z" fill="#fff" {...T} />
  <path d="M-22,-20 h44 M-14,-12 h28" stroke={C.grape} strokeWidth={4} strokeLinecap="round" />
  <Tape />
</g>;

const posterSpace: FurnitureArtFn = () => <g>
  <rect x={-38} y={-100} width={76} height={96} rx={5} fill="#2b2f7a" {...O} />
  <circle cx={10} cy={-60} r={18} fill={C.coral} {...T} />
  <ellipse cx={10} cy={-60} rx={30} ry={7} fill="none" stroke={C.sun} strokeWidth={4} transform="rotate(-15 10 -60)" />
  <path d="M-22,-24 l8,-26 l8,26 l-8,-5Z" fill="#fff" {...T} strokeWidth={1.6} />
  <circle cx={-14} cy={-38} r={3} fill={C.sky} />
  <path d="M-19,-22 l5,8 l5,-8" fill={C.orange} />
  {[[-26, -84], [26, -88], [-8, -78], [28, -24], [-30, -56]].map(([x, y]) => <path key={`${x}${y}`} d={star4(x, y, 4)} fill="#fff" />)}
  <Tape />
</g>;

const cushionHeart: FurnitureArtFn = () => <g>
  <Shadow rx={22} />
  <path d={heart(0, -20, 24)} fill={C.pink} {...O} />
  <path d={heart(0, -20, 17)} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="3 4" />
  <Shine d="M-14,-30 Q-12,-36 -6,-37" w={3} />
</g>;

const rugRainbow: FurnitureArtFn = () => <g>
  {[C.red, C.orange, C.sun, C.green, C.sky, C.grape].map((c, i) => {
    const rx = 118 - i * 17, ry = 56 - i * 8;
    return <path key={c} d={`M${-rx},-6 A${rx},${ry} 0 0 1 ${rx},-6Z`} fill={c} {...(i === 0 ? O : T)} />;
  })}
  <path d="M-118,-6 H118" stroke={INK} strokeWidth={LINE.base} strokeLinecap="round" />
</g>;

const rugCheck: FurnitureArtFn = ({ a }) => <g>
  <path d="M-108,-58 H108 L120,-4 H-120Z" fill="#fff" {...O} />
  {Array.from({ length: 16 }, (_, i) => {
    const col = i % 8, row = Math.floor(i / 8);
    if ((col + row) % 2) return null;
    const y0 = -58 + row * 27, y1 = y0 + 27;
    const xAt = (c: number, y: number) => { const half = 108 + ((y + 58) / 54) * 12; return -half + (c / 8) * half * 2; };
    return <path key={i} d={`M${xAt(col, y0)},${y0} L${xAt(col + 1, y0)},${y0} L${xAt(col + 1, y1)},${y1} L${xAt(col, y1)},${y1}Z`} fill={a} />;
  })}
  <path d="M-108,-58 H108 L120,-4 H-120Z" fill="none" {...O} />
</g>;

const sideTable: FurnitureArtFn = () => <g>
  <Shadow rx={26} />
  <ellipse cx={0} cy={-5} rx={20} ry={5} fill={C.woodDark} {...O} />
  <rect x={-5} y={-50} width={10} height={44} rx={3} fill={C.woodDark} {...T} />
  <ellipse cx={0} cy={-50} rx={34} ry={8} fill={C.sun} {...O} />
  <Shine d="M-20,-52 H-6" w={3} />
</g>;

const coffeeTable: FurnitureArtFn = () => <g>
  <Shadow rx={72} />
  {[-60, 60].map((x) => <path key={x} d={`M${x},-40 L${x + (x < 0 ? -4 : 4)},-2`} stroke={INK} strokeWidth={8} strokeLinecap="round" />)}
  {[-60, 60].map((x) => <path key={x} d={`M${x},-40 L${x + (x < 0 ? -4 : 4)},-2`} stroke={C.woodDark} strokeWidth={4} strokeLinecap="round" />)}
  <rect x={-62} y={-22} width={124} height={7} rx={3} fill={C.woodDark} {...T} />
  <rect x={-40} y={-30} width={30} height={8} rx={2} fill={C.sky} {...T} strokeWidth={1.6} />
  <rect x={-36} y={-36} width={26} height={6} rx={2} fill={C.pink} {...T} strokeWidth={1.6} />
  <rect x={-74} y={-50} width={148} height={12} rx={6} fill={C.wood} {...O} />
  <Shine d="M-60,-46 H-30" w={3} />
</g>;

const gameConsole: FurnitureArtFn = () => <g>
  <Shadow rx={28} />
  <rect x={-26} y={-28} width={40} height={24} rx={5} fill={C.charcoal} {...O} />
  <path d="M-18,-20 h18" stroke={C.mint} strokeWidth={3} strokeLinecap="round" />
  <circle cx={6} cy={-12} r={2.4} fill={C.lime} />
  <path d="M8,-10 Q4,-2 12,-2 L16,-6 H26 L30,-2 Q38,-2 34,-10 Q32,-16 26,-16 H14 Q10,-16 8,-10Z" fill={C.red} {...T} />
  <path d="M15,-10 h4 M17,-12 v4" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
  <circle cx={27} cy={-11} r={1.6} fill={C.sun} /><circle cx={30} cy={-8} r={1.6} fill={C.sky} />
</g>;

const guitar: FurnitureArtFn = () => <g>
  <Shadow rx={22} />
  <rect x={-4} y={-112} width={8} height={70} rx={2} fill={C.woodDark} {...O} />
  {[-100, -88, -76, -64].map((y) => <path key={y} d={`M-4,${y} h8`} stroke={C.sun} strokeWidth={1.4} />)}
  <rect x={-8} y={-122} width={16} height={14} rx={4} fill={C.charcoal} {...O} />
  {[-118, -112].map((y) => <g key={y}><circle cx={-11} cy={y} r={2.2} fill="#fff" {...T} strokeWidth={1} /><circle cx={11} cy={y} r={2.2} fill="#fff" {...T} strokeWidth={1} /></g>)}
  <path d="M0,-68 C-16,-68 -18,-56 -12,-48 C-24,-42 -24,-6 0,-4 C24,-6 24,-42 12,-48 C18,-56 16,-68 0,-68Z" fill={C.orange} {...O} />
  <circle cx={0} cy={-40} r={7} fill={INK} />
  <rect x={-8} y={-22} width={16} height={4} rx={2} fill={C.woodDark} {...T} strokeWidth={1.4} />
  <path d="M-1.5,-112 V-22 M1.5,-112 V-22" stroke="#fff" strokeWidth={0.8} />
  <Shine d="M-14,-30 Q-16,-20 -8,-12" w={3} />
</g>;

const wateringCan: FurnitureArtFn = ({ state }) => {
  const pour = state === 'pour';
  // pouring tilts the can forward around its front foot; the drops fall from the rose
  const tilt = pour ? 32 : 0;
  const px = 34, py = -40; // rose position before tilting
  const cx = 18, cy = -4;
  const t = (tilt * Math.PI) / 180;
  const rx = cx + (px - cx) * Math.cos(t) - (py - cy) * Math.sin(t);
  const ry = cy + (px - cx) * Math.sin(t) + (py - cy) * Math.cos(t);
  return <g>
    <Shadow rx={30} />
    <g transform={`rotate(${tilt} ${cx} ${cy})`}>
      <Tube d="M10,-26 L30,-38" c={C.sky} w={6} />
      <path d="M28,-46 L40,-38 L36,-32 L26,-38Z" fill={C.sun} {...T} />
      <path d="M-14,-46 Q-14,-60 0,-60 Q14,-60 14,-46" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <path d="M-24,-34 Q-36,-34 -34,-20 Q-32,-12 -24,-14" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M-24,-46 H16 L18,-4 H-26Z" fill={C.sky} {...O} />
      <path d="M-24,-40 H16" stroke="#fff" strokeWidth={3} opacity={0.7} />
      <path d={heart(-4, -22, 8)} fill={C.sun} {...T} strokeWidth={1.4} />
    </g>
    {pour && <Drops x={rx + 2} y={ry + 4} n={5} dx={1.5} />}
  </g>;
};

const washBasin: FurnitureArtFn = ({ state }) => {
  const on = state === 'on';
  return <g>
    <Shadow rx={30} />
    <path d="M-14,-62 L-18,-4 H18 L14,-62Z" fill="#fff" {...O} />
    <rect x={-24} y={-8} width={48} height={8} rx={3} fill="#fff" {...T} />
    <path d="M14,-80 V-100 Q14,-108 6,-108 H-4 V-100" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14,-80 V-100 Q14,-108 6,-108 H-4 V-100" fill="none" stroke="#dfe7ef" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={26} cy={-86} r={5} fill={C.red} {...T} />
    <circle cx={2} cy={-86} r={5} fill={C.sky} {...T} />
    <path d="M-38,-80 H38 Q36,-56 0,-56 Q-36,-56 -38,-80Z" fill="#fff" {...O} />
    <ellipse cx={0} cy={-80} rx={38} ry={7} fill="#fff" {...O} />
    <ellipse cx={0} cy={-79} rx={28} ry={4} fill={on ? WATER : '#cfe9f7'} {...T} strokeWidth={1.6} />
    <Shine d="M-30,-70 Q-20,-62 -8,-62" w={3} />
    {on && <WaterStream x={-4} y1={-99} y2={-80} />}
  </g>;
};

const mug: FurnitureArtFn = () => <g>
  <path d="M7,-16 q8,-1 8,6 q0,6 -8,5" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
  <path d="M7,-16 q8,-1 8,6 q0,6 -8,5" fill="none" stroke={C.red} strokeWidth={1.6} strokeLinecap="round" />
  <rect x={-10} y={-20} width={18} height={18} rx={4} fill={C.red} {...T} />
  <path d={heart(-1, -11, 4)} fill="#fff" />
  <path d="M-4,-24 q-3,-4 0,-8 M3,-24 q-3,-4 0,-8" fill="none" stroke={C.grey} strokeWidth={1.6} strokeLinecap="round" />
</g>;

const ball: FurnitureArtFn = () => <g>
  <Shadow rx={18} />
  <circle cx={0} cy={-20} r={18} fill="#fff" {...O} />
  <path d="M0,-38 Q-12,-20 0,-2 Q-20,-6 -18,-20 Q-16,-34 0,-38Z" fill={C.red} />
  <path d="M0,-38 Q12,-20 0,-2 Q20,-6 18,-20 Q16,-34 0,-38Z" fill={C.sky} />
  <path d="M-18,-22 Q0,-14 18,-22" fill="none" stroke={C.sun} strokeWidth={5} />
  <circle cx={0} cy={-20} r={18} fill="none" {...O} />
  <Shine d="M-10,-30 Q-6,-34 -2,-34" w={3} />
</g>;

export const STUDIO_FURNITURE_ART: Record<string, FurnitureArtFn> = {
  // restyled originals (ids, sizes and seat heights unchanged)
  sofa, armchair, loveseat, cozy_chair: cozyChair, pouf, cushions, dog_bed: dogBed, round_dog_bed: roundDogBed,
  rug_round: rugRound, rug_stripes: rugStripes, rug_rect: rugRect, rug_fluffy: rugFluffy,
  plant_monstera: plantMonstera, plant_cactus: plantCactus, flower_pot: flowerPot, hanging_plant: hangingPlant,
  mirror_tall: mirrorTall, mirror_round: mirrorRound, arch_mirror: archMirror, frame, poster, clock, balloons,
  shelf, wall_shelves: wallShelves, floor_lamp: floorLamp, side_lamp: sideLamp, wall_lamp: wallLamp,
  // new studio props
  studio_books: books, studio_toy_box: toyBox, studio_teddy: teddy, studio_beanbag: beanbag, studio_radio: radio,
  studio_tv: tv, studio_desk_lamp: deskLamp, studio_plant_small: plantSmall, studio_plant_tall: plantTall,
  studio_succulent: succulent, studio_vase: vase, studio_cactus_small: cactusSmall, studio_clock: wallClock,
  studio_toy_shelf: toyShelf, studio_poster_rainbow: posterRainbow, studio_poster_space: posterSpace,
  studio_cushion_heart: cushionHeart, studio_rug_rainbow: rugRainbow, studio_rug_check: rugCheck,
  studio_side_table: sideTable, studio_coffee_table: coffeeTable, studio_console: gameConsole, studio_guitar: guitar,
  studio_watering_can: wateringCan, studio_wash_basin: washBasin, studio_mug: mug, studio_ball: ball,
};
